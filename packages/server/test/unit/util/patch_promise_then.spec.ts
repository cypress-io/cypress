import { describe, expect, it, vi } from 'vitest'
import { createPromiseThen, patchPromiseThen } from '../../../lib/util/patch_promise_then'

const nativeThen = Promise.prototype.then

// Behaves like `then` in Electron's main process under the custom snapshot: an exception thrown from a
// fulfillment handler is dropped and the returned promise never settles.
const droppingThen = function (this: Promise<unknown>, onFulfilled?: ((value: unknown) => unknown) | null, onRejected?: ((reason: unknown) => unknown) | null) {
  const dropOnThrow = onFulfilled && ((value: unknown) => {
    try {
      return onFulfilled(value)
    } catch {
      return new Promise(() => {})
    }
  })

  return nativeThen.call(this, dropOnThrow, onRejected)
}

const settlesWithin = (promise: Promise<unknown>, ms = 50) => {
  return Promise.race([
    promise.then(() => 'fulfilled', () => 'rejected'),
    new Promise((resolve) => setTimeout(() => resolve('pending'), ms)),
  ])
}

describe('lib/util/patch_promise_then', () => {
  describe('patchPromiseThen', () => {
    it('leaves then alone outside the Electron main process', () => {
      class TestPromise<T> extends Promise<T> {}

      expect(patchPromiseThen(undefined, TestPromise.prototype)).toBe(false)
      expect(patchPromiseThen('renderer', TestPromise.prototype)).toBe(false)

      expect(Object.prototype.hasOwnProperty.call(TestPromise.prototype, 'then')).toBe(false)
    })

    it('replaces then in the Electron main process once', () => {
      class TestPromise<T> extends Promise<T> {}

      expect(patchPromiseThen('browser', TestPromise.prototype)).toBe(true)

      const patched = TestPromise.prototype.then

      expect(patched).not.toBe(nativeThen)
      expect(Object.getOwnPropertyDescriptor(TestPromise.prototype, 'then')).toMatchObject({ writable: true, enumerable: false, configurable: true })

      expect(patchPromiseThen('browser', TestPromise.prototype)).toBe(false)
      expect(TestPromise.prototype.then).toBe(patched)
      expect(Promise.prototype.then).toBe(nativeThen)
    })
  })

  describe('createPromiseThen', () => {
    const then = createPromiseThen(nativeThen)

    it('resolves with the value the fulfillment handler returns', async () => {
      const onFulfilled = vi.fn((value) => `${value}!`)

      await expect(then.call(Promise.resolve('value'), onFulfilled)).resolves.toBe('value!')
      expect(onFulfilled).toHaveBeenCalledWith('value')
    })

    it('rejects with the error a fulfillment handler throws', async () => {
      const error = new Error('from onFulfilled')

      await expect(then.call(Promise.resolve(), () => {
        throw error
      })).rejects.toBe(error)
    })

    it('rejects with a non-Error a fulfillment handler throws', async () => {
      await expect(then.call(Promise.resolve(), () => {
        throw 'plain'
      })).rejects.toBe('plain')
    })

    it('leaves the rejection handler as is', async () => {
      const reason = new Error('reason')
      const error = new Error('from onRejected')
      const onRejected = vi.fn(() => {
        throw error
      })

      await expect(then.call(Promise.reject(reason), undefined, onRejected)).rejects.toBe(error)
      expect(onRejected).toHaveBeenCalledWith(reason)
    })

    it('passes the value through when the fulfillment handler is not callable', async () => {
      await expect(then.call(Promise.resolve('value'), null)).resolves.toBe('value')
    })

    it('returns a promise from the species constructor', async () => {
      class TestPromise<T> extends Promise<T> {}

      const result = then.call(TestPromise.resolve('value'), (value) => value)

      expect(result).toBeInstanceOf(TestPromise)
      await expect(result).resolves.toBe('value')
    })

    it('delivers the rejection when the underlying then drops thrown errors', async () => {
      const error = new Error('from onFulfilled')
      const throwing = () => {
        throw error
      }

      expect(await settlesWithin(droppingThen.call(Promise.resolve(), throwing))).toBe('pending')

      await expect(createPromiseThen(droppingThen).call(Promise.resolve(), throwing)).rejects.toBe(error)
    })
  })
})
