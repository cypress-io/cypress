import { asyncRetry } from '../../../lib/util/async_retry'
import sinon from 'sinon'
import { expect } from 'chai'

describe('asyncRetry', () => {
  let asyncFn
  const resolution = { result: 'success' }

  beforeEach(() => {
    asyncFn = sinon.stub()
  })

  describe('base retry behavior', () => {
    describe('when succeeds on the first try', () => {
      beforeEach(() => {
        asyncFn.onFirstCall().resolves(resolution)
      })

      it('resolves with the expected resolution, only having called the original fn once', async () => {
        const res = await asyncRetry(asyncFn, {
          maxAttempts: 3,
        })()

        expect(res).to.eq(resolution)
        expect(asyncFn).to.have.been.calledOnce
      })
    })

    describe('when succeeds on the second try', () => {
      beforeEach(() => {
        asyncFn.onFirstCall().rejects(new Error('first call rejection')).onSecondCall().resolves(resolution)
      })

      it('resolves with the expected resolution, only having called the original fn twice', async () => {
        const res = await asyncRetry(asyncFn, {
          maxAttempts: 2,
        })()

        expect(res).to.eq(resolution)
        expect(asyncFn).to.have.been.calledTwice
      })
    })

    describe('when succeeds on the third try, with max attempts as 2', () => {
      beforeEach(() => {
        asyncFn
        .onFirstCall().rejects(new Error('first call rejection'))
        .onSecondCall().rejects(new Error('second call rejection'))
        .onThirdCall().resolves()
      })

      it('rejects with an aggregate error, having called original fn only twice', async () => {
        let thrown: AggregateError | undefined = undefined

        try {
          await asyncRetry(asyncFn, { maxAttempts: 2 })()
        } catch (e) {
          thrown = e
        }
        expect(thrown).not.to.be.undefined
        expect(thrown.errors.length).to.be.eq(2)
        expect(thrown.errors[0].message).to.eq('first call rejection')
        expect(thrown.errors[1].message).to.eq('second call rejection')
        expect(asyncFn).to.have.been.calledTwice
      })
    })

    describe('when fails on the first try, and a retry is not warranted', () => {
      let err

      beforeEach(() => {
        err = new Error('some error')
        asyncFn.rejects(err)
      })

      it('throws a non-aggregate error', async () => {
        let thrown: Error & { errors?: any[] }

        try {
          await asyncRetry(asyncFn, { maxAttempts: 1 })()
        } catch (e) {
          thrown = e
        }

        expect(thrown.message).to.eq(err.message)
        expect(thrown.errors).to.be.undefined
      })
    })
  })

  describe('retry delay', () => {
    let clock: sinon.SinonFakeTimers

    beforeEach(() => {
      asyncFn.rejects(new Error('reject to test retry delay'))
      clock = sinon.useFakeTimers()
    })

    afterEach(() => {
      sinon.restore()
    })

    it('waits for a duration returned by retryDelay between each retry', async () => {
      const delay = 500
      const asyncP = asyncRetry(asyncFn, { maxAttempts: 2, retryDelay: () => delay })().catch((e) => {})

      await clock.tickAsync(1)
      expect(asyncFn).to.have.been.calledOnce
      await clock.tickAsync(delay)
      expect(asyncFn).to.have.been.calledTwice
      await clock.tickAsync(delay)
      await asyncP
      expect(asyncFn).to.have.been.calledTwice
    })
  })
})
