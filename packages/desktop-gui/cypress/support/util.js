const BluebirdPromise = require('bluebird')

export const deferred = (Promise = BluebirdPromise) => {
  const deferred = {}

  deferred.promise = new Promise((resolve, reject) => {
    deferred.resolve = resolve
    deferred.reject = reject
  })

  return deferred
}

export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj))
}
