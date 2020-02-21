const Promise = require('bluebird')

const createDeferred = () => {
  const deferred = {}

  deferred.promise = new Promise((resolve, reject) => {
    deferred.resolve = resolve
    deferred.reject = reject
  })

  return deferred
}

module.exports = createDeferred
