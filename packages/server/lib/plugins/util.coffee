_ = require("lodash")
EE = require("events")
debug = require("debug")("cypress:server:plugins")
Promise = require("bluebird")

UNDEFINED_SERIALIZED = "__cypress_undefined__"

serializeError = (err) ->
  _.pick(err, "name", "message", "stack", "code", "annotated")

module.exports = {
  serializeError: serializeError

  wrapIpc: (aProcess) ->
    emitter = new EE()

    aProcess.on "message", (message) ->
      emitter.emit(message.event, message.args...)

    return {
      send: (event, args...) ->
        return if aProcess.killed

        aProcess.send({
          event: event
          args
        })

      on: emitter.on.bind(emitter)
      removeListener: emitter.removeListener.bind(emitter)
    }

  wrapChildPromise: (ipc, invoke, ids, args = []) ->
    Promise.try ->
      return invoke(ids.eventId, args)
    .then (value) ->
      ## undefined is coerced into null when sent over ipc, but we need
      ## to differentiate between them for 'task' event
      if value is undefined
        value = UNDEFINED_SERIALIZED
      ipc.send("promise:fulfilled:#{ids.invocationId}", null, value)
    .catch (err) ->
      ipc.send("promise:fulfilled:#{ids.invocationId}", serializeError(err))

  wrapParentPromise: (ipc, eventId, callback) ->
    invocationId = _.uniqueId("inv")

    new Promise (resolve, reject) ->
      handler = (err, value) ->
        ipc.removeListener("promise:fulfilled:#{invocationId}", handler)

        if err
          debug("promise rejected for id %s %o", invocationId, ":", err.stack)
          reject(_.extend(new Error(err.message), err))
          return

        if value is UNDEFINED_SERIALIZED
          value = undefined

        debug("promise resolved for id '#{invocationId}' with value", value)
        
        resolve(value)

      ipc.on("promise:fulfilled:#{invocationId}", handler)

      callback(invocationId)
}
