_       = require("lodash")
chalk   = require("chalk")
Promise = require("bluebird")

exceptions = "CI_CANNOT_COMMUNICATE".split(" ")

API = {
  getMsgByType: (type, arg1, arg2) ->
    switch type
      when "NOT_LOGGED_IN"
        "Sorry, you are not currently logged into Cypress. This request requires authentication.\n\nPlease log into Cypress and then issue this command again."
      when "TESTS_DID_NOT_START"
        "Sorry, there was an error while attempting to start your tests. The remote client never connected."
      when "PROJECT_DOES_NOT_EXIST"
        "Sorry, cannot run tests until this project has been added to Cypress."
      when "NOT_CI_ENVIRONMENT"
        "Sorry, running in CI requires a valid CI provider and environment."
      when "CI_KEY_NOT_VALID"
        "Sorry, your project's secret CI key: #{chalk.blue(arg1)} was not valid. This project cannot run in CI."
      when "CI_CANNOT_COMMUNICATE"
        "Sorry, there was a problem communicating with the remote Cypress servers. This is likely a temporarily problem. Try again later."
      when "DEV_NO_SERVER"
        " > It looks like you're not running the local api server in development. This may cause problems running the GUI."
      when "NO_PROJECT_ID"
        "Sorry, we could not find a 'projectId' in your 'cypress.json' file for this project: " + chalk.blue(arg1)
      when "NO_PROJECT_FOUND_AT_PROJECT_ROOT"
        "Sorry, we could not find a project at this path: " + chalk.blue(arg1)
      when "CANNOT_FETCH_PROJECT_TOKEN"
        "Sorry, there was a problem fetching this project's secret key."
      when "CANNOT_CREATE_PROJECT_TOKEN"
        "Sorry, there was a problem creating this project's secret key."
      when "PORT_IN_USE_SHORT"
        "Port: '#{arg1}' is already in use."
      when "PORT_IN_USE_LONG"
        "Sorry, could not run this project because this port is currently in use: " + chalk.blue(arg1) + "\n\n" + chalk.yellow("Specify a different port with the '--port <port>' argument or shut down the other process using this port.")
      when "ERROR_READING_FILE"
        "Error reading from: " + chalk.blue(arg1) + "\n\n" + chalk.yellow(arg2)
      when "ERROR_WRITING_FILE"
        "Error writing to: " + chalk.blue(arg1) + "\n\n" + chalk.yellow(arg2)
      when "SPEC_FILE_NOT_FOUND"
        "Sorry, could not run this specific spec because it was not found: " + chalk.blue(arg1)
      when "NO_CURRENTLY_OPEN_PROJECT"
        "Sorry, there is not a currently open project."

  get: (type, arg1, arg2) ->
    msg = @getMsgByType(type, arg1, arg2)
    err = new Error(msg)
    err.type = type
    err

  isCypressErr: (err) ->
    ## if we have a type
    err.type and

      ## and its found in our list of errors
      @getMsgByType(err.type) and

        ## and its not an exception
        err.type not in exceptions

  warning: (type) ->
    err = @get(type)
    @log(err, "magenta")

  log: (err, color = "red") ->
    Promise.try =>
      console.log chalk[color](err.message)

      ## bail if this error came from known
      ## list of Cypress errors
      return if @isCypressErr(err)

      ## else either log the error in raygun
      ## or log the stack trace in dev mode
      switch process.env["CYPRESS_ENV"]
        when "production"
          ## log this to raygun
        else
          ## write stack out to console
          console.log(err.stack)

  throw: (type, arg) ->
    throw @get(type, arg)

  clone: (err) ->
    ## pull off these properties
    obj = _.pick(err, "message", "type", "name", "stack", "fileName", "lineNumber", "columnNumber")

    ## and any own (custom) properties
    ## of the err object
    for own prop, val of err
      obj[prop] = val

    obj
}

module.exports = _.bindAll(API)