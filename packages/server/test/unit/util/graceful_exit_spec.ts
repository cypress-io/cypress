import '../../spec_helper'

import { GracefulExit } from '../../../lib/util/graceful-exit'

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
  })

  it('isShuttingDown is false when idle', () => {
    expect(GracefulExit.isShuttingDown).to.be.false
  })

  it('isShuttingDown is true for a step that reads it before its first await', async () => {
    const exitStub = sinon.stub(process, 'exit')

    let seenByStep: boolean | undefined

    // exitGracefully starts the first step while it is still evaluating the Promise.race that assigns
    // processTeardown, so anything a step reads before its first await sees no teardown in progress
    GracefulExit.addStep(() => {
      seenByStep = GracefulExit.isShuttingDown
    }, 'reads-isShuttingDown-synchronously')

    await GracefulExit.exitGracefully(0)

    expect(seenByStep, 'a step cannot tell that the process is exiting').to.be.true

    exitStub.restore()
  })

  it('isShuttingDown is true while exitGracefully is in progress and false after teardown completes', async () => {
    const exitStub = sinon.stub(process, 'exit')

    expect(GracefulExit.isShuttingDown).to.be.false

    let resolveStep: () => void
    const stepPromise = new Promise<void>((resolve) => {
      resolveStep = resolve
    })

    GracefulExit.addStep(async () => {
      await stepPromise
    }, 'slow-step')

    const exitPromise = GracefulExit.exitGracefully(0)

    expect(GracefulExit.isShuttingDown).to.be.true

    resolveStep!()

    await exitPromise

    expect(GracefulExit.isShuttingDown).to.be.false
    expect(exitStub).to.have.been.calledOnce

    exitStub.restore()
  })

  it('runs registered teardown steps then exits with the requested code', async () => {
    const exitStub = sinon.stub(process, 'exit')
    const step = sinon.stub().resolves()

    GracefulExit.addStep(step as any, 'test-step')
    await GracefulExit.exitGracefully(0)

    expect(step).to.have.been.calledOnce
    expect(exitStub).to.have.been.calledWith(0)
  })

  it('keeps the requested exit code when a step throws', async () => {
    const exitStub = sinon.stub(process, 'exit')
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

    expect(healthyStepFinished, 'a failing step must not abort the others').to.be.true
    expect(exitStub).to.have.been.calledWith(0)
  })

  it('reports the failing step without changing the exit code', async () => {
    const exitStub = sinon.stub(process, 'exit')
    const logStub = sinon.stub(console, 'log')

    GracefulExit.addStep(async () => {
      throw new Error('step failed')
    }, 'failing-step')

    await GracefulExit.exitGracefully(0)

    expect(logStub.args.flat().join('\n')).to.include('failing-step')
    expect(exitStub).to.have.been.calledWith(0)
  })

  it('keeps a non-zero exit code when a step throws', async () => {
    const exitStub = sinon.stub(process, 'exit')

    GracefulExit.addStep(async () => {
      throw new Error('step failed')
    }, 'failing-step')

    await GracefulExit.exitGracefully(4)

    expect(exitStub).to.have.been.calledWith(4)
  })

  it('returns the same in-flight promise when exitGracefully is called twice', async () => {
    const exitStub = sinon.stub(process, 'exit')
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

    expect(exitStub).to.have.been.calledOnce
    expect(exitStub).to.have.been.calledWith(3)
  })

  it('debounces duplicate SIGINT soon after teardown starts (single graceful exit)', async () => {
    const exitStub = sinon.stub(process, 'exit')

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

      expect(exitStub).to.have.been.calledOnce
      expect(exitStub).to.have.been.calledWith(130)
    })

    exitStub.restore()
  })

  it('SIGINT after dedup window during hung teardown forces exit 1', async function () {
    this.timeout(5000)

    const exitStub = sinon.stub(process, 'exit')

    await withoutForeignSigHandlers(async () => {
      GracefulExit.resetForTesting()

      GracefulExit.addStep(() => new Promise(() => {}), 'hang')

      process.emit('SIGINT' as NodeJS.Signals)

      await new Promise((r) => setTimeout(r, 250))

      process.emit('SIGINT' as NodeJS.Signals)

      await new Promise((r) => setTimeout(r, 50))

      expect(exitStub).to.have.been.calledWith(1)
    })

    exitStub.restore()
  })

  it('force exits with the requested code and names the pending steps when the shared budget expires', async function () {
    this.timeout(5000)

    process.env.CYPRESS_INTERNAL_TEARDOWN_TIMEOUT = '50'

    const exitStub = sinon.stub(process, 'exit')
    const logStub = sinon.stub(console, 'log')

    // a step timeout longer than the shared budget leaves the force-exit as the only way out
    GracefulExit.addStep(() => new Promise(() => {}), 'hang', 10000)

    void GracefulExit.exitGracefully(0)

    await new Promise((r) => setTimeout(r, 200))

    logStub.restore()

    expect(exitStub).to.have.been.calledWith(0)
    expect(logStub.args.flat().join('\n')).to.contain('Still waiting on: hang')

    exitStub.restore()
  })

  it('abandons a hung step on its own budget so the remaining steps still complete', async function () {
    this.timeout(5000)

    process.env.CYPRESS_INTERNAL_TEARDOWN_TIMEOUT = '1000'

    const startedAt = Date.now()
    let exitedAfter: number | undefined
    const exitStub = sinon.stub(process, 'exit').callsFake(() => {
      exitedAfter = exitedAfter ?? Date.now() - startedAt

      return undefined as never
    })
    const logStub = sinon.stub(console, 'log')

    let quickStepRan = false

    GracefulExit.addStep(() => new Promise(() => {}), 'hang')
    GracefulExit.addStep(async () => {
      await new Promise((r) => setTimeout(r, 50))
      quickStepRan = true
    }, 'quick')

    void GracefulExit.exitGracefully(0)

    await new Promise((r) => setTimeout(r, 1200))

    logStub.restore()

    const logged = logStub.args.flat().join('\n')

    expect(quickStepRan, 'the quick step is not cut off by the hung one').to.be.true
    // 0.8 of the 1000ms budget, so teardown settles before the shared force-exit timer can fire
    expect(exitedAfter).to.be.within(800, 999)
    expect(exitStub).to.have.been.calledWith(0)
    expect(logged).to.contain('The "hang" teardown step did not finish within 800ms')
    expect(logged).not.to.contain('Failed to gracefully exit')

    exitStub.restore()
  })

  it('does not leak an unhandled rejection when an abandoned step rejects later', async function () {
    this.timeout(5000)

    process.env.CYPRESS_INTERNAL_TEARDOWN_TIMEOUT = '100'

    const exitStub = sinon.stub(process, 'exit')
    const logStub = sinon.stub(console, 'log')
    const unhandled: unknown[] = []
    const onUnhandled = (reason: unknown) => unhandled.push(reason)
    // lib/unhandled_exceptions exits the process with code 1 on an unhandled rejection, which would
    // overwrite a passing run's exit code; capture instead so a leak fails an assertion
    const foreignListeners = process.listeners('unhandledRejection').slice()

    process.removeAllListeners('unhandledRejection')
    process.on('unhandledRejection', onUnhandled)

    // rejects after its own bound expires, when flushSteps is no longer awaiting it
    GracefulExit.addStep(() => new Promise((_resolve, reject) => {
      setTimeout(() => reject(new Error('late teardown failure')), 150)
    }), 'rejects-after-its-bound')

    await GracefulExit.exitGracefully(0)

    await new Promise((r) => setTimeout(r, 300))

    process.removeListener('unhandledRejection', onUnhandled)
    foreignListeners.forEach((listener) => process.on('unhandledRejection', listener))
    logStub.restore()

    expect(unhandled, 'an abandoned step leaked an unhandled rejection').to.be.empty
    expect(exitStub).to.have.been.calledWith(0)
    expect(exitStub).not.to.have.been.calledWith(1)

    exitStub.restore()
  })

  it('honors a step-specific timeout shorter than the shared budget', async function () {
    this.timeout(5000)

    process.env.CYPRESS_INTERNAL_TEARDOWN_TIMEOUT = '2000'

    const startedAt = Date.now()
    let exitedAfter: number | undefined
    const exitStub = sinon.stub(process, 'exit').callsFake(() => {
      exitedAfter = exitedAfter ?? Date.now() - startedAt

      return undefined as never
    })
    const logStub = sinon.stub(console, 'log')

    GracefulExit.addStep(() => new Promise(() => {}), 'best-effort', 100)

    void GracefulExit.exitGracefully(0)

    await new Promise((r) => setTimeout(r, 500))

    logStub.restore()

    expect(exitedAfter).to.be.within(100, 400)
    expect(exitStub).to.have.been.calledWith(0)
    expect(logStub.args.flat().join('\n')).to.contain('The "best-effort" teardown step did not finish within 100ms')

    exitStub.restore()
  })
})
