import { expect } from 'chai'
import sinon from 'sinon'
import { DataContext } from '../../../src'

import { Poller } from '../../../src/polling'
import { createTestDataContext } from '../helper'

describe('Poller', () => {
  let ctx: DataContext
  let clock: sinon.SinonFakeTimers

  beforeEach(() => {
    sinon.restore()
    clock = sinon.useFakeTimers()
    ctx = createTestDataContext('open')
  })

  afterEach(() => {
    clock.restore()
  })

  it('polls', async () => {
    const callback = sinon.stub()
    const interval = 5

    const poller = new Poller(ctx, 'relevantRunChange', interval, callback)

    const iterator = poller.start()

    expect(callback).to.have.been.calledOnce

    await clock.tickAsync(interval * 1000)
    expect(callback).to.have.been.calledTwice

    //stop iterator
    iterator.return(undefined)

    await clock.tickAsync(interval * 1000)
    expect(callback, 'should not be called again after iterator stopped').to.have.been.calledTwice
  })

  it('can change interval', async () => {
    const callback = sinon.stub()
    const interval = 5

    const poller = new Poller(ctx, 'relevantRunChange', interval, callback)

    const iterator = poller.start()

    expect(callback).to.have.been.calledOnce

    await clock.tickAsync(interval * 1000)
    expect(callback).to.have.been.calledTwice

    poller.interval = 10

    await clock.tickAsync(interval * 1000)
    expect(callback, 'should be called at one original interval after interval change').to.have.been.calledThrice

    await clock.tickAsync(interval * 1000)
    expect(callback, 'should not be called yet with longer interval').to.have.been.calledThrice

    await clock.tickAsync(interval * 1000)
    expect(callback, 'should be called after longer interval').to.have.callCount(4)

    //stop iterator
    iterator.return(undefined)
  })

  it('handles multiple pollers for the same event', async () => {
    const callback = sinon.stub()
    const interval = 5

    const poller = new Poller(ctx, 'relevantRunChange', interval, callback)
    const iterator1 = poller.start()

    expect(callback).to.have.been.calledOnce

    await clock.tickAsync(interval * 1000)
    expect(callback).to.have.been.calledTwice

    const iterator2 = poller.start()

    await clock.tickAsync(interval * 1000)
    expect(callback).to.have.been.calledThrice

    iterator1.return(undefined)
    iterator2.return(undefined)

    await clock.tickAsync(interval * 1000)
    expect(callback).to.have.been.calledThrice
  })
})
