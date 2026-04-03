import { describe, expect, it } from 'vitest'
import { withUserConcurrencyGate } from '@/lib/workers/user-concurrency-gate'

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve
  })
  return { promise, resolve }
}

describe('user concurrency gate', () => {
  it('serializes same-scope work for the same user when limit is 1', async () => {
    const firstDone = deferred<void>()
    const events: string[] = []

    const first = withUserConcurrencyGate({
      scope: 'image',
      userId: 'user-1',
      limit: 1,
      run: async () => {
        events.push('first:start')
        await firstDone.promise
        events.push('first:end')
      },
    })

    const second = withUserConcurrencyGate({
      scope: 'image',
      userId: 'user-1',
      limit: 1,
      run: async () => {
        events.push('second:start')
        events.push('second:end')
      },
    })

    await Promise.resolve()
    expect(events).toEqual(['first:start'])

    firstDone.resolve()
    await Promise.all([first, second])

    expect(events).toEqual([
      'first:start',
      'first:end',
      'second:start',
      'second:end',
    ])
  })
})
