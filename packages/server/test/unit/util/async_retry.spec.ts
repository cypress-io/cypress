import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { asyncRetry } from '../../../lib/util/async_retry'

describe('asyncRetry', () => {
  let asyncFn: ReturnType<typeof vi.fn>
  const resolution = { result: 'success' }

  beforeEach(() => {
    asyncFn = vi.fn()
  })

  describe('base retry behavior', () => {
    describe('when succeeds on the first try', () => {
      beforeEach(() => {
        asyncFn.mockResolvedValueOnce(resolution)
      })

      it('resolves with the expected resolution, only having called the original fn once', async () => {
        const res = await asyncRetry(asyncFn, {
          maxAttempts: 3,
        })()

        expect(res).toBe(resolution)
        expect(asyncFn).toHaveBeenCalledTimes(1)
      })
    })

    describe('when succeeds on the second try', () => {
      beforeEach(() => {
        asyncFn
        .mockRejectedValueOnce(new Error('first call rejection'))
        .mockResolvedValueOnce(resolution)
      })

      it('resolves with the expected resolution, only having called the original fn twice', async () => {
        const res = await asyncRetry(asyncFn, {
          maxAttempts: 2,
        })()

        expect(res).toBe(resolution)
        expect(asyncFn).toHaveBeenCalledTimes(2)
      })
    })

    describe('when succeeds on the third try, with max attempts as 2', () => {
      beforeEach(() => {
        asyncFn
        .mockRejectedValueOnce(new Error('first call rejection'))
        .mockRejectedValueOnce(new Error('second call rejection'))
        .mockResolvedValueOnce(undefined)
      })

      it('rejects with an aggregate error, having called original fn only twice', async () => {
        let thrown: AggregateError | undefined

        try {
          await asyncRetry(asyncFn, { maxAttempts: 2 })()
        } catch (e) {
          thrown = e as AggregateError
        }

        expect(thrown).toBeDefined()
        expect(thrown?.errors.length).toBe(2)
        expect(thrown?.errors[0].message).toBe('first call rejection')
        expect(thrown?.errors[1].message).toBe('second call rejection')
        expect(asyncFn).toHaveBeenCalledTimes(2)
      })
    })

    describe('when fails on the first try, and a retry is not warranted', () => {
      let err: Error

      beforeEach(() => {
        err = new Error('some error')
        asyncFn.mockRejectedValue(err)
      })

      it('throws a non-aggregate error', async () => {
        let thrown: Error & { errors?: unknown[] } | undefined

        try {
          await asyncRetry(asyncFn, { maxAttempts: 1 })()
        } catch (e) {
          thrown = e as Error & { errors?: unknown[] }
        }

        expect(thrown?.message).toBe(err.message)
        expect(thrown?.errors).toBeUndefined()
      })
    })
  })

  describe('retry delay', () => {
    beforeEach(() => {
      asyncFn.mockRejectedValue(new Error('reject to test retry delay'))
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('waits for a duration returned by retryDelay between each retry', async () => {
      const delay = 500
      const asyncP = asyncRetry(asyncFn, { maxAttempts: 2, retryDelay: () => delay })().catch(() => {})

      await vi.advanceTimersByTimeAsync(1)
      expect(asyncFn).toHaveBeenCalledTimes(1)
      await vi.advanceTimersByTimeAsync(delay)
      expect(asyncFn).toHaveBeenCalledTimes(2)
      await vi.advanceTimersByTimeAsync(delay)
      await asyncP
      expect(asyncFn).toHaveBeenCalledTimes(2)
    })
  })

  describe('onRetry option', () => {
    let err: Error

    beforeEach(() => {
      err = new Error('Some Error')
      asyncFn.mockRejectedValue(err)
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('is called with the delay and the error that occurred, before the next retry', async () => {
      const onRetryFn = vi.fn<(delay: number, e: unknown) => void>()
      const delay = 500
      const p = asyncRetry(asyncFn, { maxAttempts: 2, retryDelay: () => delay, onRetry: onRetryFn })().catch(() => {})

      await vi.advanceTimersByTimeAsync(1)
      expect(onRetryFn).toHaveBeenCalledWith(delay, err)
      await vi.runAllTimersAsync()
      await p
    })
  })
})
