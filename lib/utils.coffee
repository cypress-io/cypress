_       = require("lodash")
cp      = require("child_process")
os      = require("os")
fs      = require("fs-extra")
path    = require("path")
chalk   = require("chalk")
Promise = require("bluebird")

fs = Promise.promisifyAll(fs)

module.exports = {
  getPathToExecutable: ->
    path.join(@getDefaultAppFolder(), @getPlatformExecutable())

  getPathToUserExecutable: ->
    path.join(@getDefaultAppFolder(), @getPlatformExecutable().split("/")[0])

  getPlatformExecutable: ->
    switch p = os.platform()
      when "darwin" then "Cypress.app/Contents/MacOS/cypress"
      when "linux"  then "Cypress"
      when "win32"  then "Cypress.exe"
      else
        throw new Error("Platform: '#{p}' is not supported.")

  getDefaultAppFolder: ->
    switch p = os.platform()
      when "darwin" then "/Applications"
      when "linux"  then "/usr/local"
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
    new Promise (resolve, reject) ->
      num = ""+Math.random()

      cp.exec "#{pathToCypress} --smoke-test --ping=#{num}", (err, stdout, stderr) ->
        stdout = stdout.replace(/\s/, "")

        if err
          console.log(err)
          process.exit()

        if stdout isnt num
          ## add the path we executed cypress at here
          ## and chalk up a nice error message :-)
          console.log("Cypress was not executable. It may be corrupt. Please reinstall the latest version.")
          process.exit()
        else
          resolve()

  _fileExistsAtPath: (pathToCypress) ->
    fs.statAsync(pathToCypress)
      .bind(@)
      .return(pathToCypress)
      .catch (err) =>
        console.log("")
        console.log(chalk.bgRed.white(" -Error- "))
        console.log(chalk.red.underline("The Cypress App could not be found."))
        console.log("Expected the app to be found here:", chalk.blue(@getPathToUserExecutable()))
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

  spawn: (args, options = {}) ->
    ## this needs to change to become async and
    ## to do a lookup for the cached cypress path
    cypress = @getPathToExecutable()

    args = [].concat(args)

    _.defaults options,
      stdio: ["ignore", process.stdout, "ignore"]

    @verifyCypress(cypress).then ->
      cp.spawn cypress, args, options
}