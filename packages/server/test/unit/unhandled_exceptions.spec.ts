// The SUT lazily bare-requires lib/errors.ts, which only a ts require hook can resolve
import '@packages/ts/register'
import { createRequire } from 'module'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { handle } from '../../lib/unhandled_exceptions'

const requireCjs = createRequire(import.meta.url)
const errorsPath = requireCjs.resolve('../../lib/errors')

describe('lib/unhandled_exceptions', () => {
  const logException = vi.fn()
  const events = ['uncaughtException', 'unhandledRejection'] as const
  let originalListeners: Record<string, NodeJS.UncaughtExceptionListener[]>
  let originalExitCode: typeof process.exitCode

  function noop () {}

  beforeEach(() => {
    requireCjs.cache[errorsPath] = { exports: { logException } } as NodeModule
    originalExitCode = process.exitCode
    originalListeners = Object.fromEntries(events.map((event) => [event, process.listeners(event)]))
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)
  })

  afterEach(() => {
    delete requireCjs.cache[errorsPath]
    process.exitCode = originalExitCode
    logException.mockReset()
    vi.restoreAllMocks()

    for (const event of events) {
      process.removeAllListeners(event)
      originalListeners[event].forEach((listener) => process.on(event, listener))
    }
  })

  it('logs the error and exits with code 1', async () => {
    const err = new Error('Some Error')

    logException.mockResolvedValue(undefined)
    handle()
    process.emit('uncaughtException', err)

    await vi.waitFor(() => expect(process.exit).toHaveBeenCalledWith(1))

    expect(process.exitCode).toBe(1)
    expect(logException).toHaveBeenCalledExactlyOnceWith(err)
  })

  it('only binds once to unhandledRejection / uncaughtException, so a failing logException cannot loop forever', async () => {
    const err = new Error('Some Error')
    const logErr = new SyntaxError('Invalid file')

    // Each rejection re-emits unhandledRejection. Resolving after a few calls turns a
    // regression to `.on` into a failed assertion instead of a heap-exhausting loop.
    logException.mockImplementation(() => {
      return logException.mock.calls.length < 5 ? Promise.reject(logErr) : Promise.resolve()
    })

    handle()
    // stands in for node's default handler, which would otherwise crash the worker
    process.on('unhandledRejection', noop)

    process.emit('uncaughtException', err)
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(logException.mock.calls).toEqual([[err], [logErr]])
    expect(process.exit).not.toHaveBeenCalled()
  })
})
