import '../../spec_helper'

import { createFrameFlushDetector } from '../../../lib/util/video_frame_flush'

describe('lib/util/video_frame_flush', () => {
  let clock: sinon.SinonFakeTimers

  beforeEach(() => {
    clock = sinon.useFakeTimers()
  })

  afterEach(() => {
    clock.restore()
  })

  const expectResolved = async (promise: Promise<void>) => {
    let resolved = false

    promise.then(() => {
      resolved = true
    })

    // flush the promise queue without advancing timers
    await Promise.resolve()
    await Promise.resolve()

    return resolved
  }

  it('resolves after the quiet period when no frames arrive', async () => {
    const { waitForFrameFlush } = createFrameFlushDetector({ quietPeriodMs: 250, maxWaitMs: 1000 })

    const promise = waitForFrameFlush()

    clock.tick(249)
    expect(await expectResolved(promise)).to.be.false

    clock.tick(1)
    expect(await expectResolved(promise)).to.be.true
  })

  it('extends the quiet period when frames arrive during the wait', async () => {
    const { markFrameWritten, waitForFrameFlush } = createFrameFlushDetector({ quietPeriodMs: 250, maxWaitMs: 1000 })

    const promise = waitForFrameFlush()

    clock.tick(200)
    markFrameWritten()

    // original quiet period has elapsed, but the frame restarted it
    clock.tick(100)
    expect(await expectResolved(promise)).to.be.false

    clock.tick(150)
    expect(await expectResolved(promise)).to.be.true
  })

  it('resolves at the max wait even if frames keep arriving', async () => {
    const { markFrameWritten, waitForFrameFlush } = createFrameFlushDetector({ quietPeriodMs: 250, maxWaitMs: 1000 })

    const promise = waitForFrameFlush()

    for (let i = 0; i < 9; i++) {
      clock.tick(100)
      markFrameWritten()
    }

    expect(await expectResolved(promise)).to.be.false

    clock.tick(100)
    expect(await expectResolved(promise)).to.be.true
  })

  it('ignores frames marked after the wait has resolved', async () => {
    const { markFrameWritten, waitForFrameFlush } = createFrameFlushDetector({ quietPeriodMs: 250, maxWaitMs: 1000 })

    const promise = waitForFrameFlush()

    clock.tick(250)
    expect(await expectResolved(promise)).to.be.true

    // must not schedule timers for a completed wait
    markFrameWritten()
    expect(clock.countTimers()).to.eq(0)
  })

  it('ignores frames marked while no wait is pending', () => {
    const { markFrameWritten } = createFrameFlushDetector({ quietPeriodMs: 250, maxWaitMs: 1000 })

    markFrameWritten()
    expect(clock.countTimers()).to.eq(0)
  })
})
