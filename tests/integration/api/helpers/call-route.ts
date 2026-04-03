import { NextRequest } from 'next/server'

type RouteParamValue = string | string[] | undefined
type RouteParams = Record<string, RouteParamValue>
type HeaderMap = Record<string, string>

type RouteHandler<TParams extends RouteParams = RouteParams> = (
  req: NextRequest,
  ctx: { params: Promise<TParams> },
) => Promise<Response>

export async function callRoute<TParams extends RouteParams>(
  handler: RouteHandler<TParams>,
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  body?: unknown,
  options?: { headers?: HeaderMap; params?: TParams; query?: Record<string, string> },
) {
  const url = new URL('http://localhost:3000/api/test')
  if (options?.query) {
    for (const [key, value] of Object.entries(options.query)) {
      url.searchParams.set(key, value)
    }
  }

  const payload = body === undefined ? undefined : JSON.stringify(body)
  const req = new NextRequest(url, {
    method,
    headers: {
      ...(payload ? { 'content-type': 'application/json' } : {}),
      ...(options?.headers || {}),
    },
    ...(payload ? { body: payload } : {}),
  })
  const context = { params: Promise.resolve((options?.params || {}) as TParams) }
  return await handler(req, context)
}
