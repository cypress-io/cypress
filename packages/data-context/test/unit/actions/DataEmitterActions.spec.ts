import { describe, expect, it, beforeAll, jest } from '@jest/globals'
import type { DataContext } from '../../../src'
import { DataEmitterActions } from '../../../src/actions/DataEmitterActions'
import { createTestDataContext } from '../helper'

describe('DataEmitterActions', () => {
  describe('.subscribeTo', () => {
    let ctx: DataContext

    beforeAll(() => {
      ctx = createTestDataContext('open')
    })

    it('properly iterates through events', async () => {
      const actions = new DataEmitterActions(ctx)
      const subscription = actions.subscribeTo('specsChange')

      let items = 0
      let completed = false

      const testIterator = async () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for await (const _value of subscription) {
          items += 1
        }
        completed = true
      }

      const iteratorPromise = testIterator()

      // Simulate subsequent events and an eventual return
      setTimeout(() => {
        actions.specsChange()
      }, 10)

      setTimeout(() => {
        actions.specsChange()
      }, 10)

      setTimeout(() => {
        subscription.return(undefined)
      }, 10)

      await iteratorPromise

      expect(items).toEqual(3)
      expect(completed).toBe(true)
    })

    it('handles iterating through events if an event is emitted before the iteration', async () => {
      const actions = new DataEmitterActions(ctx)
      const subscription = actions.subscribeTo('specsChange')

      let items = 0
      let completed = false

      const testIterator = async () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for await (const _value of subscription) {
          items += 1
        }
        completed = true
      }

      // Simulate events happening before the iteration and a return afterwards
      actions.specsChange()
      actions.specsChange()

      const iteratorPromise = testIterator()

      setTimeout(() => {
        subscription.return(undefined)
      }, 10)

      await iteratorPromise

      expect(items).toEqual(3)
      expect(completed).toBe(true)
    })

    it('handles stopping the loop if return is called before the iteration', async () => {
      const actions = new DataEmitterActions(ctx)
      const subscription = actions.subscribeTo('specsChange')

      let items = 0
      let completed = false

      const testIterator = async () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for await (const _value of subscription) {
          items += 1
        }
        completed = true
      }

      // Simulate a return before we ever iterate. This will immediately cancel without handling the events
      actions.specsChange()
      actions.specsChange()
      subscription.return(undefined)

      const iteratorPromise = testIterator()

      await iteratorPromise

      expect(items).toEqual(0)
      expect(completed).toBe(true)
    })

    const createTestIterator = (subscription) => {
      const returnVal = {
        items: 0,
        completed: false,
        iterator: undefined,
      }

      const testIterator = async () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for await (const _value of subscription) {
          returnVal.items += 1
        }
        returnVal.completed = true
      }

      returnVal.iterator = testIterator

      return returnVal
    }

    it('handles multiple subscriptions', async () => {
      const actions = new DataEmitterActions(ctx)

      const unsubscribe1 = jest.fn()

      const subscription1 = actions.subscribeTo('specsChange', { sendInitial: true, onUnsubscribe: unsubscribe1 })

      const iteratorFactory1 = createTestIterator(subscription1)

      const iteratorPromise1 = iteratorFactory1.iterator()

      // Simulate subsequent events and an eventual return
      setImmediate(() => {
        actions.specsChange()
      })

      let subscription2
      let iteratorFactory2
      let iteratorPromise2
      let unsubscribe2 = jest.fn()

      setImmediate(() => {
        subscription2 = actions.subscribeTo('specsChange', { sendInitial: true, onUnsubscribe: unsubscribe2 })

        iteratorFactory2 = createTestIterator(subscription2)

        iteratorPromise2 = iteratorFactory2.iterator()
      })

      setImmediate(() => {
        actions.specsChange()
      })

      setImmediate(() => {
        subscription1.return(undefined)
        subscription2.return(undefined)
      })

      await iteratorPromise1
      await iteratorPromise2

      // first subscription should be called 3 times
      expect(iteratorFactory1.items).toEqual(3)
      expect(iteratorFactory1.completed).toBe(true)

      // second subscription should be called 2 times
      expect(iteratorFactory2.items).toEqual(2)
      expect(iteratorFactory2.completed).toBe(true)

      // should unsubscribe and see there is 1 subscription still listening
      expect(unsubscribe1).toHaveBeenNthCalledWith(1, 1)
      expect(unsubscribe2).toHaveBeenNthCalledWith(1, 0)
    })
  })
})
