import { expect } from 'chai'
import type { DataContext } from '../../../src'
import { DataEmitterActions } from '../../../src/actions/DataEmitterActions'
import { createTestDataContext } from '../helper'

describe('DataEmitterActions', () => {
  context('.subscribeTo', () => {
    let ctx: DataContext

    before(() => {
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

      expect(items).to.eql(3)
      expect(completed).to.be.true
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

      expect(items).to.eql(3)
      expect(completed).to.be.true
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

      expect(items).to.eql(0)
      expect(completed).to.be.true
    })
  })
})
