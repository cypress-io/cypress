_     = require("lodash")
chalk = require("chalk")

module.exports = {
  getErrMsgByType: (type) ->
    switch type
      when "NOT_LOGGED_IN"
        "Sorry, you are not currently logged into Cypress. This request requires authentication.\nPlease log into Cypress and then issue this command again."
      else
        "foo"

  write: (str) ->
    process.stdout.write(str + "\n")

  exit: (code = 1) ->
    process.exit(code)

  throw: (str, msgs...) ->
    str = [chalk.red(str)].concat(msgs).join(" ")
    @write(str)
    @exit()

    ## TODO: update tests not to have to do this
    # ## since we normally stub out exit we need to
    # ## throw the str here so our test code's promises
    # ## do what they're supposed to do!
    # if process.env["CYPRESS_ENV"] isnt "production"
    #   throw str

  die: (type) ->
    msg = @getErrMsgByType(type)
    @throw(msg)

  clone: (err) ->
    ## pull off these properties
    obj = _.pick(err, "message", "type", "name", "stack", "fileName", "lineNumber", "columnNumber")

    ## and any own (custom) properties
    ## of the err object
    for own prop, val of err
      obj[prop] = val

    obj
}