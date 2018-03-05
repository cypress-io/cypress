Promise = require("bluebird")
log = require("debug")("cypress:server:task")
plugins = require("./plugins")

module.exports = {
  run: (options) ->
    log("run task", options.task, "with arg", options.arg)

    Promise
    .try ->
      if not plugins.has("task:requested")
        log("task:requested event is not registered")
        throw new Error("The 'task:requested' event has not been registered in the plugins file, so cy.task() cannot run")

      plugins.execute("task:requested", options.task, options.arg)
    .then (result) ->
      if result is undefined
        log("result is undefined")
        throw new Error("The task '#{options.task}' was not handled in the plugins file")

      log("result is:", result)
      return result
    .timeout(options.timeout)
    .catch Promise.TimeoutError, ->
      log("timed out after #{options.timeout}ms")
      err = new Error("Process timed out\ntask: #{options.task}")
      err.timedout = true
      throw err
}
