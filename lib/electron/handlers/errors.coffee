_     = require("lodash")
chalk = require("chalk")

API = {
  getMsgByType: (type) ->
    switch type
      when "NOT_LOGGED_IN"
        "Sorry, you are not currently logged into Cypress. This request requires authentication.\nPlease log into Cypress and then issue this command again."
      when "TESTS_DID_NOT_START"
        "Sorry, there was an error while attempting to start your tests. The remote client never connected."

  get: (type) ->
    msg = @getMsgByType(type)
    err = new Error(msg)
    err.type = type
    err

  exit: (code = 1) ->
    process.exit(code)

  log: (err) ->
    ## if our err instance matches
    ## a type then its come from us
    ## else just use the standard err.message
    msg = @getMsgByType(err.type) ? err.message

    console.log chalk.red(msg)

    if process.env["CYPRESS_ENV"] isnt "production"
      console.log err.stack

    [chalk.red(err.message)].concat(msg).join(" ")

  exitWith: (err) ->
    @log(err)
    @exit()

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