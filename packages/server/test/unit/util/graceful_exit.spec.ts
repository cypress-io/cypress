import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GracefulExit } from '../../../lib/util/graceful-exit'

// resetForTesting is a no-op unless IS_TEST is set
;(globalThis as { IS_TEST?: boolean }).IS_TEST = true

function stubExit () {
  return vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never)
}

function stubLog () {
  return vi.spyOn(console, 'log').mockImplementation(() => {})
}

/**
 * Other packages (e.g. firefox-profile) register SIGINT handlers that call
 * process.exit(130). process.emit('SIGINT') invokes every listener, so a stub
 * on process.exit counts unrelated exits and flakes in CI when many listeners
 * are present. Snapshot listeners, clear them, run the callback, then restore.
 */
function withoutForeignSigHandlers<T> (fn: () => Promise<T>): Promise<T> {
  const sigintListeners = process.listeners('SIGINT').slice()
  const sigtermListeners = process.listeners('SIGTERM').slice()

  process.removeAllListeners('SIGINT')
  process.removeAllListeners('SIGTERM')

  return Promise.resolve()
  .then(fn)
  .finally(() => {
    GracefulExit.resetForTesting()
    process.removeAllListeners('SIGINT')
    process.removeAllListeners('SIGTERM')
    sigintListeners.forEach((listener) => process.on('SIGINT', listener))
    sigtermListeners.forEach((listener) => process.on('SIGTERM', listener))
  })
}

describe('lib/util/graceful-exit', () => {
  beforeEach(() => {
    GracefulExit.resetForTesting()
  })

  afterEach(() => {
    GracefulExit.resetForTesting()
    delete process.env.CYPRESS_INTERNAL_TEARDOWN_TIMEOUT
    vi.restoreAllMocks()
  })

  it('isShuttingDown is false when idle', () => {
    expect(GracefulExit.isShuttingDown).toBe(false)
  })

  it('isShuttingDown is true for a step that reads it before its first await', async () => {
    const exitStub = stubExit()

    let seenByStep: boolean | undefined

    // exitGracefully starts the first step while it is still evaluating the Promise.race that assigns
    // processTeardown, so anything a step reads before its first await sees no teardown in progress
    GracefulExit.addStep(() => {
      seenByStep = GracefulExit.isShuttingDown
    }, 'reads-isShuttingDown-synchronously')

    await GracefulExit.exitGracefully(0)

    expect(seenByStep, 'a step cannot tell that the process is exiting').toBe(true)

    exitStub.mockRestore()
  })

  it('isShuttingDown is true while exitGracefully is in progress and false after teardown completes', async () => {
    const exitStub = stubExit()

    expect(GracefulExit.isShuttingDown).toBe(false)

    let resolveStep: () => void
    const stepPromise = new Promise<void>((resolve) => {
      resolveStep = resolve
    })

    GracefulExit.addStep(async () => {
      await stepPromise
    }, 'slow-step')

    const exitPromise = GracefulExit.exitGracefully(0)

    expect(GracefulExit.isShuttingDown).toBe(true)

    resolveStep!()

    await exitPromise

    expect(GracefulExit.isShuttingDown).toBe(false)
    expect(exitStub).toHaveBeenCalledOnce()

    exitStub.mockRestore()
  })

  it('runs registered teardown steps then exits with the requested code', async () => {
    const exitStub = stubExit()
    const step = vi.fn().mockResolvedValue(undefined)

    GracefulExit.addStep(step as any, 'test-step')
    await GracefulExit.exitGracefully(0)

    expect(step).toHaveBeenCalledOnce()
    expect(exitStub).toHaveBeenCalledWith(0)
  })

  it('keeps the requested exit code when a step throws', async () => {
    const exitStub = stubExit()
    let healthyStepFinished = false

    GracefulExit.addStep(async () => {
      throw new Error('step failed')
    }, 'failing-step')

    // resolves on a later tick, so this only holds if teardown awaited it despite the sibling failure
    GracefulExit.addStep(async () => {
      await new Promise((resolve) => setImmediate(resolve))
      healthyStepFinished = true
    }, 'healthy-step')

    await GracefulExit.exitGracefully(0)

    expect(healthyStepFinished, 'a failing step must not abort the others').toBe(true)
    expect(exitStub).toHaveBeenCalledWith(0)
  })

  it('reports the failing step without changing the exit code', async () => {
    const exitStub = stubExit()
    const logStub = stubLog()

    GracefulExit.addStep(async () => {
      throw new Error('step failed')
    }, 'failing-step')

    await GracefulExit.exitGracefully(0)

    expect(logStub.mock.calls.flat().join('\n')).toContain('failing-step')
    expect(exitStub).toHaveBeenCalledWith(0)
  })

  it('keeps a non-zero exit code when a step throws', async () => {
    const exitStub = stubExit()

    GracefulExit.addStep(async () => {
      throw new Error('step failed')
    }, 'failing-step')

    await GracefulExit.exitGracefully(4)

    expect(exitStub).toHaveBeenCalledWith(4)
  })

  it('returns the same in-flight promise when exitGracefully is called twice', async () => {
    const exitStub = stubExit()
    let resolveStep: () => void
    const stepPromise = new Promise<void>((resolve) => {
      resolveStep = resolve
    })

    GracefulExit.addStep(async () => {
      await stepPromise
    }, 'slow-step')

    const p1 = GracefulExit.exitGracefully(3)
    const p2 = GracefulExit.exitGracefully(7)

    resolveStep!()

    await Promise.all([p1, p2])

    expect(exitStub).toHaveBeenCalledOnce()
    expect(exitStub).toHaveBeenCalledWith(3)
  })

  it('debounces duplicate SIGINT soon after teardown starts (single graceful exit)', async () => {
    const exitStub = stubExit()

    await withoutForeignSigHandlers(async () => {
      GracefulExit.resetForTesting()

      let resolveStep: () => void
      const stepPromise = new Promise<void>((resolve) => {
        resolveStep = resolve
      })

      GracefulExit.addStep(async () => {
        await stepPromise
      }, 'slow-step')

      process.emit('SIGINT' as NodeJS.Signals)
      process.emit('SIGINT' as NodeJS.Signals)

      resolveStep!()

      await new Promise((r) => setImmediate(r))

      expect(exitStub).toHaveBeenCalledOnce()
      expect(exitStub).toHaveBeenCalledWith(130)
    })

    exitStub.mockRestore()
  })

  it('SIGINT after dedup window during hung teardown forces exit 1', async () => {
    const exitStub = stubExit()

    await withoutForeignSigHandlers(async () => {
      GracefulExit.resetForTesting()

      GracefulExit.addStep(() => new Promise(() => {}), 'hang')

      process.emit('SIGINT' as NodeJS.Signals)

      await new Promise((r) => setTimeout(r, 250))

      process.emit('SIGINT' as NodeJS.Signals)

      await new Promise((r) => setTimeout(r, 50))

      expect(exitStub).toHaveBeenCalledWith(1)
    })

    exitStub.mockRestore()
  }, 5000)

  it('force exits with the requested code and names the pending steps when the shared budget expires', async () => {
    process.env.CYPRESS_INTERNAL_TEARDOWN_TIMEOUT = '50'

    const exitStub = stubExit()
    const logStub = stubLog()

    // a step timeout longer than the shared budget leaves the force-exit as the only way out
    GracefulExit.addStep(() => new Promise(() => {}), 'hang', 10000)

    void GracefulExit.exitGracefully(0)

    await new Promise((r) => setTimeout(r, 200))

    const logged = logStub.mock.calls.flat().join('\n')

    logStub.mockRestore()

    expect(exitStub).toHaveBeenCalledWith(0)
    expect(logged).toContain('Still waiting on: hang')

    exitStub.mockRestore()
  }, 5000)

  it('abandons a hung step on its own budget so the remaining steps still complete', async () => {
    process.env.CYPRESS_INTERNAL_TEARDOWN_TIMEOUT = '1000'

    const startedAt = Date.now()
    let exitedAfter: number | undefined
    const exitStub = vi.spyOn(process, 'exit').mockImplementation(() => {
      exitedAfter = exitedAfter ?? Date.now() - startedAt

      return undefined as never
    })
    const logStub = stubLog()

    let quickStepRan = false

    GracefulExit.addStep(() => new Promise(() => {}), 'hang')
    GracefulExit.addStep(async () => {
      await new Promise((r) => setTimeout(r, 50))
      quickStepRan = true
    }, 'quick')

    void GracefulExit.exitGracefully(0)

    await new Promise((r) => setTimeout(r, 1200))

    const logged = logStub.mock.calls.flat().join('\n')

    logStub.mockRestore()

    expect(quickStepRan, 'the quick step is not cut off by the hung one').toBe(true)
    // 0.8 of the 1000ms budget, so teardown settles before the shared force-exit timer can fire
    expect(exitedAfter).toBeGreaterThanOrEqual(800)
    expect(exitedAfter).toBeLessThanOrEqual(999)
    expect(exitStub).toHaveBeenCalledWith(0)
    expect(logged).toContain('The "hang" teardown step did not finish within 800ms')
    expect(logged).not.toContain('Failed to gracefully exit')

    exitStub.mockRestore()
  }, 5000)

  it('a reset cancels the step bounds of an in-flight teardown', async () => {
    process.env.CYPRESS_INTERNAL_TEARDOWN_TIMEOUT = '200'

    const exitStub = stubExit()
    const logStub = stubLog()

    GracefulExit.addStep(() => new Promise(() => {}), 'hang')

    void GracefulExit.exitGracefully(0)

    GracefulExit.resetForTesting()

    await new Promise((r) => setTimeout(r, 400))

    logStub.mockRestore()

    // a step timer that outlives the reset settles the abandoned flush, and its `finally` exits the
    // process for real once a spec restores the stub, taking the rest of the suite with it
    expect(exitStub, 'a cancelled teardown still exited the process').not.toHaveBeenCalled()

    exitStub.mockRestore()
  }, 5000)

  it('does not leak an unhandled rejection when an abandoned step rejects later', async () => {
    process.env.CYPRESS_INTERNAL_TEARDOWN_TIMEOUT = '100'

    const exitStub = stubExit()
    const logStub = stubLog()
    const unhandled: unknown[] = []
    let exitCalls: unknown[][] = []
    const onUnhandled = (reason: unknown) => unhandled.push(reason)

    // lib/unhandled_exceptions exits the process with code 1 on an unhandled rejection, which would
    // overwrite a passing run's exit code. Take the reports here instead, so a leak fails an
    // assertion rather than killing the suite, and prepend so nothing else consumes them first.
    process.prependListener('unhandledRejection', onUnhandled)

    try {
      // rejects after its own bound expires, when flushSteps is no longer awaiting it
      GracefulExit.addStep(() => {
        return new Promise((_resolve, reject) => {
          setTimeout(() => reject(new Error('late teardown failure')), 150)
        })
      }, 'rejects-after-its-bound')

      await GracefulExit.exitGracefully(0)

      await new Promise((r) => setTimeout(r, 300))
    } finally {
      process.removeListener('unhandledRejection', onUnhandled)
      logStub.mockRestore()
      exitCalls = exitStub.mock.calls.slice()
      exitStub.mockRestore()
    }

    expect(unhandled, 'an abandoned step leaked an unhandled rejection').toEqual([])
    expect(exitCalls).toContainEqual([0])
    expect(exitCalls).not.toContainEqual([1])
  }, 5000)

  it('honors a step-specific timeout shorter than the shared budget', async () => {
    process.env.CYPRESS_INTERNAL_TEARDOWN_TIMEOUT = '2000'

    const startedAt = Date.now()
    let exitedAfter: number | undefined
    const exitStub = vi.spyOn(process, 'exit').mockImplementation(() => {
      exitedAfter = exitedAfter ?? Date.now() - startedAt

      return undefined as never
    })
    const logStub = stubLog()

    GracefulExit.addStep(() => new Promise(() => {}), 'best-effort', 100)

    void GracefulExit.exitGracefully(0)

    await new Promise((r) => setTimeout(r, 500))

    const logged = logStub.mock.calls.flat().join('\n')

    logStub.mockRestore()

    expect(exitedAfter).toBeGreaterThanOrEqual(100)
    expect(exitedAfter).toBeLessThanOrEqual(400)
    expect(exitStub).toHaveBeenCalledWith(0)
    expect(logged).toContain('The "best-effort" teardown step did not finish within 100ms')

    exitStub.mockRestore()
  }, 5000)
})
