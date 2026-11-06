type OnFulfilled = ((value: unknown) => unknown) | null | undefined
type OnRejected = ((reason: unknown) => unknown) | null | undefined
type Then = (this: Promise<unknown>, onFulfilled?: OnFulfilled, onRejected?: OnRejected) => Promise<unknown>

const PATCHED = Symbol('cypress.patchedPromiseThen')

const rejectOnThrow = (onFulfilled: (value: unknown) => unknown) => {
  return (value: unknown) => {
    try {
      return onFulfilled(value)
    } catch (error) {
      return Promise.reject(error)
    }
  }
}

export const createPromiseThen = (originalThen: Then): Then => {
  const then: Then = function (onFulfilled, onRejected) {
    return originalThen.call(this, typeof onFulfilled === 'function' ? rejectOnThrow(onFulfilled) : onFulfilled, onRejected)
  }

  Object.defineProperty(then, PATCHED, { value: true })

  return then
}

/**
 * Electron 43+ drops an exception thrown from a fulfillment handler in the main process once it loads our
 * custom V8 snapshot: the promise `then()` returns never settles, so errors hang instead of propagating.
 * Returning the rejection instead of throwing it still works there.
 */
export const patchPromiseThen = (processType: string | undefined = process.type, prototype: Promise<unknown> = Promise.prototype): boolean => {
  if (processType !== 'browser' || Object.prototype.hasOwnProperty.call(prototype.then, PATCHED)) {
    return false
  }

  Object.defineProperty(prototype, 'then', {
    value: createPromiseThen(prototype.then),
    writable: true,
    enumerable: false,
    configurable: true,
  })

  return true
}
