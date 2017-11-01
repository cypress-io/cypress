_ = require("lodash")
Promise = require("bluebird")
log = require("debug")("cypress:server:plugins:child")

module.exports = {
  wrapPromise: (ipc, callbackId, callback) ->
    invocationId = _.uniqueId("inv")

    new Promise (resolve, reject) ->
      handler = (err, value) ->
        ipc.removeEventListener("promise:fulfilled:#{invocationId}", handler)
        if err
          log("promise rejected for id", invocationId, ":", err)
          reject(err)
          return

        log("promise resolved for id", invocationId)
        resolve(value)

      ipc.on("promise:fulfilled:#{invocationId}", handler)

      callback(invocationId)
}
