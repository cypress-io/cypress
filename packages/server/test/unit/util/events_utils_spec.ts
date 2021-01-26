import { expect } from 'chai'
import AsyncEE from '../../../lib/util/AsyncEE'

const nextTick = () => {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

describe('events_utils', () => {
  context('AsyncEE emitThen', () => {
    it('waits for all returned promises', async () => {
      const myAsyncEE = new AsyncEE()

      let called1; let called2

      myAsyncEE.on('event:async', () => {
        console.log('foobar')

        return nextTick()
        .then(() => {
          called1 = true
        })
      })

      myAsyncEE.on('event:async', () => {
        return nextTick()
        .then(() => {
          called2 = true
        })
      })

      await myAsyncEE.emit('event:async')
      expect(called1).eq(undefined)
      expect(called2).eq(undefined)
      await myAsyncEE.emitThen('event:async')

      expect(called1).eq(true)
      expect(called2).eq(true)
    })

    it('works with sync callbacks', async () => {
      const myAsyncEE = new AsyncEE()

      let called1

      myAsyncEE.on('event:async', () => {
        called1 = true
      })

      myAsyncEE.emitThen('event:async')

      expect(called1).eq(true)
    })

    it('can emit multiple times', async () => {
      const myAsyncEE = new AsyncEE()

      let called1 = 0

      myAsyncEE.on('event:async', () => {
        return nextTick().then(() => {
          called1++
        })
      })

      await myAsyncEE.emitThen('event:async')
      await myAsyncEE.emitThen('event:async')

      expect(called1).eq(2)
    })

    it('works with once', async () => {
      const myAsyncEE = new AsyncEE()

      let called1 = 0

      myAsyncEE.once('event:async', () => {
        called1++
      })

      await myAsyncEE.emitThen('event:async')
      await myAsyncEE.emitThen('event:async')

      expect(called1).eq(1)
    })
  })
})
