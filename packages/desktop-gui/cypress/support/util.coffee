_ = require("lodash")
BluebirdPromise = require("bluebird")

module.exports = {
  deferred: (Promise = BluebirdPromise) ->
    deferred = {}
    deferred.promise = new Promise (resolve, reject) ->
      deferred.resolve = resolve
      deferred.reject = reject
    return deferred

  stubIpc: (ipcStub, events) ->
    _.each events, (returnsFn, event) ->
      stub = ipcStub
        .withArgs(event)
        .as(event)

      returnsFn(stub)
}
