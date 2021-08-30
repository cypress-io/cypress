import Bluebird from 'bluebird'

interface Deferred {
  promise: Bluebird<any>
  resolve: (thenableOrResult?: unknown) => void
  reject: (thenableOrResult?: unknown) => void
}

export const createDeferred = () => {
  const deferred = {} as Deferred

  deferred.promise = new Bluebird((resolve, reject) => {
    deferred.resolve = resolve
    deferred.reject = reject
  })

  return deferred
}
