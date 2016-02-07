_       = require("lodash")
chalk   = require("chalk")
Promise = require("bluebird")

API = {
  getMsgByType: (type) ->
    switch type
      when "NOT_LOGGED_IN"
        "Sorry, you are not currently logged into Cypress. This request requires authentication.\nPlease log into Cypress and then issue this command again."
      when "TESTS_DID_NOT_START"
        "Sorry, there was an error while attempting to start your tests. The remote client never connected."
      when "PROJECT_DOES_NOT_EXIST"
        "Sorry, cannot run tests until this project has been added to Cypress."
      when "NOT_CI_ENVIRONMENT"
        "Sorry, running in CI requires a valid CI provider and environment."

  get: (type) ->
    msg = @getMsgByType(type)
    err = new Error(msg)
    err.type = type
    err

  log: (err) ->
    Promise.try =>
      ## if our err instance matches
      ## a type then its come from us
      ## else just use the standard err.message
      msg = @getMsgByType(err.type) ? err.message

      stdErr = @getMsgByType(err.type)

      console.log chalk.red(stdErr ? err.message)

      ## bail if this error came from Cypress
      return if stdErr

      ## else either log the error in raygun
      ## or log the stack trace in dev mode
      switch process.env["CYPRESS_ENV"]
        when "production"
          ## log this to raygun
        else
          ## write stack out to console
          console.log(err.stack)

  throw: (type) ->
    throw @get(type)

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