_ = require("lodash")
EE = require("events")
debug = require("debug")("cypress:server:plugins")
which = require("which")
Promise = require("bluebird")
fixPath = require("fix-path")

UNDEFINED_SERIALIZED = "__cypress_undefined__"

serializeError = (err) ->
  _.pick(err, "name", "message", "stack", "code", "annotated")

# Finds Node binary path
#
# Note about fix-path:
#   while fix-path is good, it can cause unexpected behavior when running Cypress locally
#   for example, using NVM we set local Node to 8
#   then fix-path adds all user paths, and the found Node is whatever we have
#   installed globally, like 6 or 10 (NVM path comes later)
#   So this function only fixes the path, if the Node cannot be found on first attempt
#
findNodeInFullPath = () ->
  debug("finding Node with $PATH %s", process.env.PATH)

  Promise.fromCallback (cb) -> which('node', cb)
  .catch () ->
    debug("could not find Node, trying to fix path")
    # Fix the $PATH on macOS when run from a GUI app
    fixPath()
    debug("searching again with fixed $PATH %s", process.env.PATH)
    Promise.fromCallback (cb) -> which('node', cb)
  .then (found) ->
    debug("found Node %s", found)
    found
  , () ->
    debug("could not find Node")
    return null

module.exports = {
  serializeError: serializeError

  # instead of the built-in Node process, specify a path to 3rd party Node
  # https://devdocs.io/node/child_process#child_process_child_process_fork_modulepath_args_options
  findNode: () ->
    # since the Node will not move around, finding it once should be enough
    resolvedNode = _.memoize(findNodeInFullPath)()
    resolvedNode

  # convenient for confirming from tests that a warning has been printed to the console
  logWarning: () ->
    console.warn.apply(console, arguments)

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
