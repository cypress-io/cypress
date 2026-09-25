import '../../spec_helper'
import { expect, sinon } from '../../spec_helper'
import { ActivityMonitor } from '../../../lib/util/activity_monitor'

describe('lib/util/activity_monitor', () => {
  let clock: sinon.SinonFakeTimers

  beforeEach(() => {
    clock = sinon.useFakeTimers()
  })

  afterEach(() => {
    clock.restore()
  })

  it('does not fire before the timeout elapses', async () => {
    const onInactivity = sinon.stub().resolves(true)
    const monitor = new ActivityMonitor({ timeout: 1000, onInactivity })

    monitor.start()

    await clock.tickAsync(999)

    expect(onInactivity).not.to.have.been.called
  })

  it('fires once the run has been silent for the timeout', async () => {
    const onInactivity = sinon.stub().resolves(true)
    const monitor = new ActivityMonitor({ timeout: 1000, onInactivity })

    monitor.start()

    await clock.tickAsync(1000)

    expect(onInactivity).to.have.been.calledOnce
  })

  it('resets the deadline on activity', async () => {
    const onInactivity = sinon.stub().resolves(true)
    const monitor = new ActivityMonitor({ timeout: 1000, onInactivity })

    monitor.start()

    // keep bumping just under the deadline - the run is slow, not hung
    for (let i = 0; i < 5; i++) {
      await clock.tickAsync(900)
      monitor.bump()
    }

    expect(onInactivity).not.to.have.been.called

    // now go quiet
    await clock.tickAsync(1000)

    expect(onInactivity).to.have.been.calledOnce
  })

  it('resumes watching when the run turns out to be alive', async () => {
    // false = not hung; the run answered, so keep watching
    const onInactivity = sinon.stub().resolves(false)
    const monitor = new ActivityMonitor({ timeout: 1000, onInactivity })

    monitor.start()

    await clock.tickAsync(1000)
    expect(onInactivity).to.have.been.calledOnce

    // a second silent window should trigger another check
    await clock.tickAsync(1000)
    expect(onInactivity).to.have.been.calledTwice
  })

  it('stays stopped once the run is confirmed hung', async () => {
    const onInactivity = sinon.stub().resolves(true)
    const monitor = new ActivityMonitor({ timeout: 1000, onInactivity })

    monitor.start()

    await clock.tickAsync(1000)
    expect(onInactivity).to.have.been.calledOnce

    // no further checks after a confirmed hang
    await clock.tickAsync(5000)
    expect(onInactivity).to.have.been.calledOnce
  })

  it('ignores activity while confirming a suspected hang', async () => {
    let resolveCheck: (hung: boolean) => void
    const onInactivity = sinon.stub().returns(new Promise<boolean>((res) => {
      resolveCheck = res
    }))
    const monitor = new ActivityMonitor({ timeout: 1000, onInactivity })

    monitor.start()

    await clock.tickAsync(1000)
    expect(onInactivity).to.have.been.calledOnce

    // late traffic arriving mid-probe must not reset the deadline out from under it
    monitor.bump()
    resolveCheck!(false)
    await clock.tickAsync(0)

    // still only the original check; bump was ignored while confirming
    expect(onInactivity).to.have.been.calledOnce

    await clock.tickAsync(1000)
    expect(onInactivity).to.have.been.calledTwice
  })

  it('aborts the signal passed to onInactivity when stopped mid-check', async () => {
    let signal: AbortSignal | undefined
    let resolveCheck: (hung: boolean) => void
    const onInactivity = sinon.stub().callsFake((s: AbortSignal) => {
      signal = s

      return new Promise<boolean>((res) => {
        resolveCheck = res
      })
    })
    const monitor = new ActivityMonitor({ timeout: 1000, onInactivity })

    monitor.start()

    await clock.tickAsync(1000)
    expect(signal!.aborted).to.be.false

    // the spec ended while the liveness check was still running
    monitor.stop()
    expect(signal!.aborted).to.be.true

    resolveCheck!(false)
    await clock.tickAsync(5000)

    // a stopped monitor does not resume watching after the check resolves
    expect(onInactivity).to.have.been.calledOnce
  })

  it('passes a fresh, unaborted signal to each check', async () => {
    const signals: AbortSignal[] = []
    const onInactivity = sinon.stub().callsFake(async (s: AbortSignal) => {
      signals.push(s)

      return false
    })
    const monitor = new ActivityMonitor({ timeout: 1000, onInactivity })

    monitor.start()

    await clock.tickAsync(2000)

    expect(signals).to.have.length(2)
    expect(signals[0]).not.to.eq(signals[1])
    expect(signals.every((s) => !s.aborted)).to.be.true
  })

  it('does not fire after stop()', async () => {
    const onInactivity = sinon.stub().resolves(true)
    const monitor = new ActivityMonitor({ timeout: 1000, onInactivity })

    monitor.start()
    await clock.tickAsync(500)
    monitor.stop()

    await clock.tickAsync(5000)

    expect(onInactivity).not.to.have.been.called
  })

  it('reports started only while watching', async () => {
    const onInactivity = sinon.stub().resolves(true)
    const monitor = new ActivityMonitor({ timeout: 1000, onInactivity })

    expect(monitor.started).to.be.false

    monitor.start()
    expect(monitor.started).to.be.true

    // a confirmed hang stops watching
    await clock.tickAsync(1000)
    expect(monitor.started).to.be.false
  })

  it('ignores bump() before start()', async () => {
    const onInactivity = sinon.stub().resolves(true)
    const monitor = new ActivityMonitor({ timeout: 1000, onInactivity })

    monitor.bump()

    await clock.tickAsync(5000)

    expect(onInactivity).not.to.have.been.called
  })
})
