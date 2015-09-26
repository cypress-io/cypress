_       = require("lodash")
path    = require("path")
os      = require("os")
chalk   = require("chalk")
utils   = require("../utils")
Run     = require("./run")
Install = require("./install")

class Ci
  constructor: (key, options = {}) ->
    if not (@ instanceof Ci)
      return new Ci(key, options)

    ## if we dont have a key assume
    ## its in an env variable
    key ?= process.env.CYPRESS_CI_KEY

    return @_noKeyErr(options) if not key

    _.defaults options,
      initialize: true
      key:        key

    return if not options.initialize

    @initialize(options)

  _noKeyErr: (options) ->
    console.log("")
    console.log(chalk.bgRed.white(" -Error- "))
    console.log(chalk.red.underline("Running Cypress in CI requires a secret project key."))
    console.log("")
    console.log("You did not pass a specific key to:", chalk.blue("cypress ci"))
    console.log("")
    console.log("Since no key was passed, we checked for an environment\nvariable but none was found with the name:", chalk.blue("CYPRESS_CI_KEY"))
    console.log("")
    console.log("You can receive your project's secret key by running\nthe terminal command:", chalk.blue("cypress get:key"))
    console.log("")
    console.log("Please provide us your project's secret key and then rerun.")
    process.exit(1)

  initialize: (options) ->
    run = ->
      Run(null, options)

    utils.verifyCypressExists()
      .then(run)
      .catch ->
        console.log("")
        console.log("Cypress was not found:", chalk.green("Installing a fresh copy."))
        console.log("")

        Install({after: run, displayOpen: false})

module.exports = Ci