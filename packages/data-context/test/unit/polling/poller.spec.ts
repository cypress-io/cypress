import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals'
import { DataContext } from '../../../src'

import { Poller } from '../../../src/polling'
import { createTestDataContext } from '../helper'

describe('Poller', () => {
  let ctx: DataContext

  beforeEach(() => {
    jest.useFakeTimers()
    ctx = createTestDataContext('open')
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('polls', async () => {
    const callback = jest.fn()
    const interval = 5

    const poller = new Poller(ctx, 'relevantRunChange', interval, callback)

    const iterator = poller.start()

    expect(callback).toHaveBeenCalledTimes(1)

    await jest.advanceTimersByTimeAsync(interval * 1000)
    expect(callback).toHaveBeenCalledTimes(2)

    //stop iterator
    iterator.return(undefined)

    await jest.advanceTimersByTimeAsync(interval * 1000)
    // should not be called again after iterator stopped
    expect(callback).toHaveBeenCalledTimes(2)
  })

  it('can change interval', async () => {
    const callback = jest.fn()
    const interval = 5

    const poller = new Poller(ctx, 'relevantRunChange', interval, callback)

    const iterator = poller.start()

    expect(callback).toHaveBeenCalledTimes(1)

    await jest.advanceTimersByTimeAsync(interval * 1000)
    expect(callback).toHaveBeenCalledTimes(2)

    poller.interval = 10

    await jest.advanceTimersByTimeAsync(interval * 1000)
    // should be called at one original interval after interval change'
    expect(callback).toHaveBeenCalledTimes(3)

    await jest.advanceTimersByTimeAsync(interval * 1000)
    // should not be called yet with longer interval
    expect(callback).toHaveBeenCalledTimes(3)

    await jest.advanceTimersByTimeAsync(interval * 1000)
    // should be called after longer interval
    expect(callback).toHaveBeenCalledTimes(4)

    //stop iterator
    iterator.return(undefined)
  })

  it('handles multiple pollers for the same event', async () => {
    const callback = jest.fn()
    const interval = 5

    const poller = new Poller(ctx, 'relevantRunChange', interval, callback)
    const iterator1 = poller.start()

    expect(callback).toHaveBeenCalledTimes(1)

    await jest.advanceTimersByTimeAsync(interval * 1000)
    expect(callback).toHaveBeenCalledTimes(2)

    const iterator2 = poller.start()

    await jest.advanceTimersByTimeAsync(interval * 1000)
    expect(callback).toHaveBeenCalledTimes(3)

    iterator1.return(undefined)
    iterator2.return(undefined)

    await jest.advanceTimersByTimeAsync(interval * 1000)
    expect(callback).toHaveBeenCalledTimes(3)
  })

  it('returns initial value', async () => {
    const callback = jest.fn()
    const interval = 5

    const initialValue = { foo: true }

    const poller = new Poller<any, any>(ctx, 'relevantRunChange', interval, callback)
    const iterator1 = poller.start({ initialValue })

    expect(callback).toHaveBeenCalledTimes(1)

    const result1 = await iterator1.next()

    expect(result1.value).toEqual(initialValue)
  })

  it('stores and returns meta values for each subscription', async () => {
    const callback = jest.fn()
    const interval = 5

    const poller = new Poller<'relevantRunChange', { name: string }, { name: string}>(ctx, 'relevantRunChange', interval, callback)

    expect(poller.subscriptions).toHaveLength(0)

    const iterator1 = poller.start({ meta: { name: 'one' } })

    expect(poller.subscriptions).toHaveLength(1)
    expect(poller.subscriptions.map((sub) => sub.meta.name)).toEqual(['one'])

    const iterator2 = poller.start({ meta: { name: 'two' } })

    expect(poller.subscriptions).toHaveLength(2)
    expect(poller.subscriptions.map((sub) => sub.meta.name)).toEqual(['one', 'two'])

    iterator1.return(undefined)

    expect(poller.subscriptions).toHaveLength(1)
    expect(poller.subscriptions.map((sub) => sub.meta.name)).toEqual(['two'])

    iterator2.return(undefined)

    expect(poller.subscriptions).toHaveLength(0)
  })
})
