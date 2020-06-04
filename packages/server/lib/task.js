_ = require("lodash")
Promise = require("bluebird")
debug = require("debug")("cypress:server:task")
plugins = require("./plugins")

docsUrl = "https://on.cypress.io/api/task"

throwKnownError = (message, props = {}) ->
  err = new Error(message)
  _.extend(err, props, { isKnownError: true })
  throw err

module.exports = {
  run: (pluginsFilePath, options) ->
    debug("run task", options.task, "with arg", options.arg)

    fileAndDocsUrl = "\n\nFix this in your plugins file here:\n#{pluginsFilePath}\n\n#{docsUrl}"

    Promise
    .try ->
      if not plugins.has("task")
        debug("'task' event is not registered")
        throwKnownError("The 'task' event has not been registered in the plugins file. You must register it before using cy.task()#{fileAndDocsUrl}")

      plugins.execute("task", options.task, options.arg)
    .then (result) ->
      if result is "__cypress_unhandled__"
        debug("task is unhandled")
        return plugins.execute("_get:task:keys").then (keys) ->
          throwKnownError("The task '#{options.task}' was not handled in the plugins file. The following tasks are registered: #{keys.join(", ")}#{fileAndDocsUrl}")

      if result is undefined
        debug("result is undefined")
        return plugins.execute("_get:task:body", options.task).then (body) ->
          handler = if body then "\n\nThe task handler was:\n\n#{body}" else ""
          throwKnownError("The task '#{options.task}' returned undefined. You must return a value, null, or a promise that resolves to a value or null to indicate that the task was handled.#{handler}#{fileAndDocsUrl}")

      debug("result is:", result)
      return result
    .timeout(options.timeout)
    .catch Promise.TimeoutError, ->
      debug("timed out after #{options.timeout}ms")
      plugins.execute("_get:task:body", options.task).then (body) ->
        err = new Error("The task handler was:\n\n#{body}#{fileAndDocsUrl}")
        err.timedOut = true
        throw err
}
