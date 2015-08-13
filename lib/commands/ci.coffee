_     = require("lodash")
path  = require("path")
os    = require("os")
chalk = require("chalk")
run   = require("./run")

class Ci
  constructor: (key, options = {}) ->
    if not (@ instanceof Ci)
      return new Ci(key, options)

    ## if we dont have a key assume
    ## its in an env variable
    key ?= process.env.CYPRESS_API_KEY

    return @_noKeyErr(options) if not key

    options.key = key

    @ci(options)

  _noKeyErr: (options) ->
    console.log("")
    console.log(chalk.bgRed.white(" -Error- "))
    console.log(chalk.red.underline("Running Cypress in CI requires a secret project key."))
    console.log("")
    console.log("You did not pass a specific key to:", chalk.blue("cypress ci"))
    console.log("")
    console.log("Since no key was passed, we checked for an environment\nvariable but none was found with the name:", chalk.blue("CYPRESS_API_KEY"))
    console.log("")
    console.log("You can receive your project's secret key by running\nthe terminal command:", chalk.blue("cypress get:key"))
    console.log("")
    console.log("Please provide us your project's secret key and then rerun.")
    process.exit(1)

  ci: (options) ->
    run null, _.pick(options, "reporter", "key")

module.exports = Ci