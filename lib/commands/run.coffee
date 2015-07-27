_       = require("lodash")
path    = require("path")
os      = require("os")
fs      = require("fs-extra")
cp      = require("child_process")
chalk   = require("chalk")
Promise = require("bluebird")

fs = Promise.promisifyAll(fs)

class Run
  getDefaultPathToCypress: ->
    switch p = os.platform()
      when "darwin"  then "/Applications/Cypress.app/Contents/MacOS/cypress"
      when "linux64" then "/usr/local/bin"
      # when "win64"   then "i/dont/know/yet"
      else
        throw new Error("Platform: '#{p}' is not supported.")

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
      .return(pathToCypress)
      .catch (err) ->
        console.log(chalk.bgRed.white(" Error: "), chalk.red.underline("Cypress App could not be found."))
        console.log("Searched in path:", chalk.blue(pathToCypress))
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

  constructor: (project = ".", options = {}) ->
    if not (@ instanceof Run)
      return new Run(project, options)

    _.defaults options,
      spec:     null
      reporter: "spec"
      cypress:  @getDefaultPathToCypress()
      project:  path.resolve(process.cwd(), project)

    @run(options)

module.exports = Run