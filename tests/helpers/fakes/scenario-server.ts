import http, { type IncomingMessage, type ServerResponse } from 'node:http'

export type FakeScenarioMode =
  | 'success'
  | 'queued_then_success'
  | 'retryable_error_then_success'
  | 'fatal_error'
  | 'malformed_response'
  | 'timeout'

export type FakeResponseSpec = {
  status: number
  headers?: Record<string, string>
  body?: string | Buffer | Record<string, unknown> | unknown[] | null
  delayMs?: number
}

export type FakeRequestRecord = {
  method: string
  path: string
  query: string
  bodyText: string
  headers: Record<string, string | string[] | undefined>
}

type RouteKey = `${Uppercase<string>} ${string}`

type RouteScenario = {
  mode: FakeScenarioMode
  submitResponse?: FakeResponseSpec
  pollSequence?: FakeResponseSpec[]
  errorCode?: string
  delayMs?: number
}

function routeKey(method: string, path: string): RouteKey {
  return `${method.toUpperCase()} ${path}` as RouteKey
}

function normalizeHeaders(headers: IncomingMessage['headers']): Record<string, string | string[] | undefined> {
  return Object.fromEntries(Object.entries(headers))
}

function toBodyText(chunks: Buffer[]): string {
  if (chunks.length === 0) return ''
  return Buffer.concat(chunks).toString('utf8')
}

function isJsonBody(body: FakeResponseSpec['body']): body is Record<string, unknown> | unknown[] | null {
  return body === null || Array.isArray(body) || (!!body && typeof body === 'object' && !Buffer.isBuffer(body))
}

async function writeResponse(
  res: ServerResponse,
  spec: FakeResponseSpec,
  inheritedDelayMs: number | undefined,
) {
  const delayMs = spec.delayMs ?? inheritedDelayMs ?? 0
  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs))
  }

  const headers = { ...(spec.headers || {}) }
  if (isJsonBody(spec.body) && !headers['content-type']) {
    headers['content-type'] = 'application/json'
  }
  res.writeHead(spec.status, headers)

  if (spec.body === undefined) {
    res.end()
    return
  }
  if (Buffer.isBuffer(spec.body)) {
    res.end(spec.body)
    return
  }
  if (isJsonBody(spec.body)) {
    res.end(JSON.stringify(spec.body))
    return
  }
  res.end(spec.body)
}

export async function startScenarioServer() {
  const requests = new Map<RouteKey, FakeRequestRecord[]>()
  const routes = new Map<RouteKey, { queue: FakeResponseSpec[]; mode: FakeScenarioMode; delayMs?: number }>()

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || '/', 'http://127.0.0.1')
    const key = routeKey(req.method || 'GET', url.pathname)
    const entry = routes.get(key)
    const chunks: Buffer[] = []
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    }
    const bodyText = toBodyText(chunks)
    const history = requests.get(key) || []
    history.push({
      method: (req.method || 'GET').toUpperCase(),
      path: url.pathname,
      query: url.search,
      bodyText,
      headers: normalizeHeaders(req.headers),
    })
    requests.set(key, history)

    if (!entry) {
      await writeResponse(res, {
        status: 404,
        body: { error: 'SCENARIO_ROUTE_NOT_FOUND', path: url.pathname },
      }, 0)
      return
    }

    const next = entry.queue.length > 1 ? entry.queue.shift() : entry.queue[0]
    if (!next) {
      await writeResponse(res, {
        status: 500,
        body: { error: 'SCENARIO_DEPLETED', path: url.pathname, mode: entry.mode },
      }, entry.delayMs)
      return
    }

    await writeResponse(res, next, entry.delayMs)
  })

  await new Promise<void>((resolve, reject) => {
    server.listen(0, '127.0.0.1', () => resolve())
    server.once('error', reject)
  })

  const address = server.address()
  if (!address || typeof address === 'string') {
    throw new Error('SCENARIO_SERVER_ADDRESS_INVALID')
  }
  const baseUrl = `http://127.0.0.1:${address.port}`

  return {
    baseUrl,
    defineScenario(input: {
      method: string
      path: string
      mode: FakeScenarioMode
      submitResponse?: FakeResponseSpec
      pollSequence?: FakeResponseSpec[]
      errorCode?: string
      delayMs?: number
    }) {
      const key = routeKey(input.method, input.path)
      const queue: FakeResponseSpec[] = []
      if (input.submitResponse) {
        queue.push(input.submitResponse)
      }
      if (input.pollSequence && input.pollSequence.length > 0) {
        queue.push(...input.pollSequence)
      }
      if (queue.length === 0) {
        throw new Error(`SCENARIO_EMPTY_QUEUE: ${key}`)
      }
      const scenario: RouteScenario = {
        mode: input.mode,
        submitResponse: input.submitResponse,
        pollSequence: input.pollSequence,
        errorCode: input.errorCode,
        delayMs: input.delayMs,
      }
      routes.set(key, {
        queue,
        mode: scenario.mode,
        delayMs: scenario.delayMs,
      })
      requests.delete(key)
    },
    getRequests(method: string, path: string): FakeRequestRecord[] {
      return [...(requests.get(routeKey(method, path)) || [])]
    },
    reset() {
      routes.clear()
      requests.clear()
    },
    async close() {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error)
            return
          }
          resolve()
        })
      })
    },
  }
}
