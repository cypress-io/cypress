import * as Promise from 'bluebird'

export function createDeferred<T> () {
  let resolve: (thenableOrResult?: T | PromiseLike<T> | undefined) => void
  let reject: any
  const promise = new Promise<T>(function (_resolve, _reject) {
    resolve = _resolve
    reject = _reject
  })

  return {
    //@ts-ignore
    resolve,
    reject,
    promise,
  }
}
