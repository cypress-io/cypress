EE = require("events")

module.exports = (aProcess) ->
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
