import '../../spec_helper'

import { GracefulExit } from '../../../lib/util/graceful-exit'

describe('lib/util/graceful-exit', () => {
  beforeEach(() => {
    GracefulExit.resetForTesting()
  })

  afterEach(() => {
    GracefulExit.resetForTesting()
    delete process.env.CYPRESS_INTERNAL_TEARDOWN_TIMEOUT
  })

  it('runs registered teardown steps then exits with the requested code', async () => {
    const exitStub = sinon.stub(process, 'exit')
    const step = sinon.stub().resolves()

    GracefulExit.addStep(step as any, 'test-step')
    await GracefulExit.exitGracefully(0)

    expect(step).to.have.been.calledOnce
    expect(exitStub).to.have.been.calledWith(0)
  })

  it('exits with code 1 when a step throws', async () => {
    const exitStub = sinon.stub(process, 'exit')

    GracefulExit.addStep(async () => {
      throw new Error('step failed')
    }, 'failing-step')

    await GracefulExit.exitGracefully(0)

    expect(exitStub).to.have.been.calledWith(1)
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

  it('SIGINT after dedup window during hung teardown forces exit 1', async function () {
    this.timeout(5000)

    const exitStub = sinon.stub(process, 'exit')

    GracefulExit.addStep(() => new Promise(() => {}), 'hang')

    process.emit('SIGINT' as NodeJS.Signals)

    await new Promise((r) => setTimeout(r, 250))

    process.emit('SIGINT' as NodeJS.Signals)

    await new Promise((r) => setTimeout(r, 50))

    expect(exitStub).to.have.been.calledWith(1)
  })

  it('force exits after teardown timeout when a step never completes', async function () {
    this.timeout(5000)

    process.env.CYPRESS_INTERNAL_TEARDOWN_TIMEOUT = '50'

    const exitStub = sinon.stub(process, 'exit')

    GracefulExit.addStep(() => new Promise(() => {}), 'hang')

    void GracefulExit.exitGracefully(0)

    await new Promise((r) => setTimeout(r, 200))

    expect(exitStub).to.have.been.calledWith(1)
  })
})
