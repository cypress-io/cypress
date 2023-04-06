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

  it('returns initial value', async () => {
    const callback = sinon.stub()
    const interval = 5

    const initialValue = { foo: true }

    const poller = new Poller<any, any>(ctx, 'relevantRunChange', interval, callback)
    const iterator1 = poller.start({ initialValue })

    expect(callback).to.have.been.calledOnce

    const result1 = await iterator1.next()

    expect(result1.value).to.eq(initialValue)
  })

  it('stores and returns meta values for each subscription', async () => {
    const callback = sinon.stub()
    const interval = 5

    const poller = new Poller<'relevantRunChange', { name: string }, { name: string}>(ctx, 'relevantRunChange', interval, callback)

    expect(poller.subscriptions).to.have.length(0)

    const iterator1 = poller.start({ meta: { name: 'one' } })

    expect(poller.subscriptions).to.have.length(1)
    expect(poller.subscriptions.map((sub) => sub.meta.name)).to.eql(['one'])

    const iterator2 = poller.start({ meta: { name: 'two' } })

    expect(poller.subscriptions).to.have.length(2)
    expect(poller.subscriptions.map((sub) => sub.meta.name)).to.eql(['one', 'two'])

    iterator1.return(undefined)

    expect(poller.subscriptions).to.have.length(1)
    expect(poller.subscriptions.map((sub) => sub.meta.name)).to.eql(['two'])

    iterator2.return(undefined)

    expect(poller.subscriptions).to.have.length(0)
  })
})
