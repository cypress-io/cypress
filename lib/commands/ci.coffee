_       = require("lodash")
chalk   = require("chalk")
run     = require("./run")
utils   = require("../utils")

class Ci
  constructor: (key, options = {}) ->
    if not (@ instanceof Ci)
      return new Ci(key, options)

    ## if we dont have a key assume
    ## its in an env variable
    key ?= process.env.CYPRESS_RECORD_KEY or process.env.CYPRESS_CI_KEY

    return @_noKeyErr(options) if not key

    _.defaults options,
      initialize: true
      ci:         true
      key:        key

    return if not options.initialize

    @initialize(options)

  _noKeyErr: (options) ->
    console.log("")
    console.log(chalk.bgRed.white(" -Error- "))
    console.log(chalk.red.underline("Running Cypress in CI requires a Record Key."))
    console.log("")
    console.log("You did not pass a specific key to:", chalk.blue("cypress ci"))
    console.log("")
    console.log("Since no key was passed, we checked for an environment\nvariable but none was found with the name:", chalk.blue("CYPRESS_RECORD_KEY"))
    console.log("")
    console.log("https://on.cypress.io/what-is-a-record-key")

    process.exit(1)

  initialize: (options) ->
    run.start(null, options)

module.exports = Ci
