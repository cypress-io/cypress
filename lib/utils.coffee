_        = require("lodash")
cp       = require("child_process")
os       = require("os")
fs       = require("fs-extra")
path     = require("path")
chalk    = require("chalk")
Xvfb     = require("xvfb")
userhome = require("userhome")
Promise  = require("bluebird")

fs   = Promise.promisifyAll(fs)
xvfb = Promise.promisifyAll(new Xvfb({silent: true}))

module.exports = {
  xvfb: xvfb

  getPathToExecutable: ->
    path.join(@getDefaultAppFolder(), @getPlatformExecutable())

  getPathToUserExecutable: ->
    path.join(@getDefaultAppFolder(), @getPlatformExecutable().split("/")[0])

  getPlatformExecutable: ->
    switch p = os.platform()
      when "darwin" then "Cypress.app/Contents/MacOS/Cypress"
      when "linux"  then "Cypress/Cypress"
      when "win32"  then "Cypress/Cypress.exe"
      else
        throw new Error("Platform: '#{p}' is not supported.")

  getDefaultAppFolder: ->
    switch p = os.platform()
      when "darwin" then "/Applications"
      when "linux"  then userhome(".cypress")
      # when "linux"  then "/usr/local/lib"
      # when "win32"   then "i/dont/know/yet"
      else
        throw new Error("Platform: '#{p}' is not supported.")

  getOs: ->
    switch p = os.platform()
      when "darwin" then "mac"
      when "linux"  then "linux64"
      when "win32"  then "win"
      else
        throw new Error("Platform: '#{p}' is not supported.")

  _cypressSmokeTest: (pathToCypress) ->
    ## cache the smoke test checksum so we
    ## dont have to do this on every cli command
    new Promise (resolve, reject) =>
      num = ""+Math.random()

      cp.exec "#{pathToCypress} --smoke-test --ping=#{num}", (err, stdout, stderr) =>

        if err
          console.log(err)
          process.exit(1)
          reject(err)

        if stdout.replace(/\s/, "") isnt num
          console.log("")
          console.log(chalk.bgRed.white(" -Error- "))
          console.log(chalk.red.underline("Cypress was not executable, it may be corrupt."))
          console.log("")
          console.log("Cypress was found at this path:", chalk.blue(@getPathToUserExecutable()))
          console.log("")
          console.log(chalk.yellow("To fix this reinstall Cypress with:"))
          console.log(chalk.cyan("cypress install"))
          console.log("")

          process.exit(1)
          reject()
        else
          resolve()

  _fileExistsAtPath: (pathToCypress, options = {}) ->
    fs.statAsync(pathToCypress)
      .bind(@)
      .return(pathToCypress)
      .catch (err) =>
        ## allow us to bubble up the error if catch is false
        return throw(err) if options.catch is false

        console.log("")
        console.log(chalk.bgRed.white(" -Error- "))
        console.log(chalk.red.underline("The Cypress App could not be found."))
        console.log("Expected the app to be found here:", chalk.blue(@getPathToUserExecutable()))
        console.log("")
        console.log(chalk.yellow("To fix this do (one) of the following:"))
        console.log("1. Reinstall Cypress with:", chalk.cyan("cypress install"))
        console.log("2. If Cypress is stored in another location, move it to the expected location")
        ## TODO talk about how to permanently change the path to the cypress executable
        # console.log("3. Specify the existing location of Cypress with:", chalk.cyan("cypress run --cypress path/to/cypress"))
        console.log("")
        process.exit(1)

  verifyCypress: (pathToCypress, options = {}) ->
    _.defaults options,
      catch: true

    ## this needs to change to become async and
    ## to do a lookup for the cached cypress path
    pathToCypress ?= @getPathToExecutable()

    ## verify that there is a file at this path
    @_fileExistsAtPath(pathToCypress, options)

      ## now verify that we can spawn cypress successfully
      .then(@_cypressSmokeTest)
      .return(pathToCypress)

  startXvfb: ->
    xvfb.startAsync().catch (err) ->
      console.log("")
      console.log(chalk.bgRed.white(" -Error- "))
      console.log(chalk.red.underline("Could not start Cypress headlessly. Your CI provider must support XVFB."))
      console.log("")
      process.exit(1)

  stopXvfb: ->
    xvfb.stopAsync()

  spawn: (args, options = {}) ->
    args = [].concat(args)

    _.defaults options,
      verify: false
      xvfb: os.platform() is "linux"
      stdio: ["ignore", process.stdout, "ignore"]

    spawn = =>
      @verifyCypress().then (pathToCypress) =>
        console.log "pathToCypress", pathToCypress
        if options.verify
          console.log(chalk.green("Cypress application is valid and should be okay to run:"), chalk.blue(@getPathToUserExecutable()))
          process.exit()

        sp = cp.spawn pathToCypress, args, options
        if options.xvfb
          ## make sure we close down xvfb
          ## when our spawned process exits
          sp.on "close", @stopXvfb

        ## when our spawned process exits
        ## make sure we kill our own process
        ## with its exit code (to bubble up errors)
        sp.on "exit", process.exit

    if options.xvfb
      @startXvfb().then(spawn)
    else
      spawn()
}