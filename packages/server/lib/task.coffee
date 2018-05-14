Promise = require("bluebird")
debug = require("debug")("cypress:server:task")
plugins = require("./plugins")

throwKnownError = (message) ->
  err = new Error(message)
  err.isKnownError = true
  throw err

module.exports = {
  run: (options) ->
    debug("run task", options.task, "with arg", options.arg)

    Promise
    .try ->
      if not plugins.has("task")
        debug("'task' event is not registered")
        throwKnownError("The 'task' event has not been registered in the plugins file, so cy.task() cannot run")

      plugins.execute("task", options.task, options.arg)
    .then (result) ->
      if result is "__cypress_unhandled__"
        throwKnownError("The task '#{options.task}' was not handled in the plugins file")

      if result is undefined
        debug("result is undefined")
        throwKnownError("The task '#{options.task}' returned undefined. Return a promise, a value, or null to indicate that the task was handled.")

      debug("result is:", result)
      return result
    .timeout(options.timeout)
    .catch Promise.TimeoutError, ->
      debug("timed out after #{options.timeout}ms")
      err = new Error("Process timed out\ntask: #{options.task}")
      err.timedOut = true
      throw err
    .catch (err) ->
      throw err
}
