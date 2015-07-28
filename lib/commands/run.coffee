_       = require("lodash")
os      = require("os")
fs      = require("fs-extra")
cp      = require("child_process")
path    = require("path")
chalk   = require("chalk")
Promise = require("bluebird")
utils   = require("../utils")

fs = Promise.promisifyAll(fs)

class Run
  constructor: (project = ".", options = {}) ->
    if not (@ instanceof Run)
      return new Run(project, options)

    _.defaults options,
      spec:     null
      reporter: "spec"
      cypress:  utls.getPathToExecutable()
      project:  path.resolve(process.cwd(), project)

    @run(options)

  _cypressSmokeTest: (pathToCypress) ->
    new Promise (resolve, reject) ->
      num = ""+Math.random()

      cp.exec "#{pathToCypress} --smoke-test --ping=#{num}", (err, stdout, stderr) ->
        stdout = stdout.replace(/\s/, "")

        if err
          console.log(err)
          process.exit()

        if stdout isnt num
          ## add the path we executed cypress at here
          console.log("Cypress was not executable. Perhaps it is corrupt. Please reinstall the latest version.")
          process.exit()
        else
          resolve()

  _fileExistsAtPath: (pathToCypress) ->
    fs.statAsync(pathToCypress)
      .bind(@)
      .return(pathToCypress)
      .catch (err) ->
        console.log("")
        console.log(chalk.bgRed.white(" -Error- "))
        console.log(chalk.red.underline("The Cypress App could not be found."))
        console.log("Expected the app to be found here:", chalk.blue(utils.getPathToUserExecutable()))
        console.log("")
        console.log(chalk.yellow("To fix this do (one) of the following:"))
        console.log("1. Reinstall Cypress with:", chalk.cyan("cypress install"))
        console.log("2. If Cypress is stored in another location, move it to the expected location")
        console.log("3. Specify the existing location of Cypress with:", chalk.cyan("cypress run --cypress path/to/cypress"))
        console.log("")
        process.exit()

  verifyCypress: (pathToCypress) ->
    ## verify that there is a file at this path
    @_fileExistsAtPath(pathToCypress)

      ## now verify that we can spawn cypress successfully
      .then(@_cypressSmokeTest)

  run: (options) ->
    { cypress } = options

    @verifyCypress(cypress).then ->
      args = ["--headless", "--project", options.project]

      ## if we have a specific spec push that into the args
      if options.spec
        args.push("--spec", options.spec)

      cp.spawn cypress, args, {stdio: "inherit"}

module.exports = Run