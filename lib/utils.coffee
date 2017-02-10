_        = require("lodash")
cp       = require("child_process")
os       = require("os")
fs       = require("fs-extra")
path     = require("path")
chalk    = require("chalk")
Xvfb     = require("xvfb")
home     = require("home-or-tmp")
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
      when "linux"  then path.join(home, ".cypress")
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

  _fileExistsAtPath: (options = {}) ->
    ## this needs to change to become async and
    ## to do a lookup for the cached cypress path
    _.defaults options,
      pathToCypress: @getPathToExecutable()

    fs.statAsync(options.pathToCypress)
      .bind(@)
      .return(options.pathToCypress)
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

  verifyCypress: (options = {}) ->
    _.defaults options,
      catch: true

    ## verify that there is a file at this path
    @_fileExistsAtPath(options)

  verifyCypressExists: (options = {}) ->
    _.defaults options,
      catch: false

    @_fileExistsAtPath(options)

  getCypressPath: ->
    msgs = [
      ["Path to Cypress:", chalk.blue(@getPathToUserExecutable())]
    ]

    log = ->
      console.log("")
      msgs.forEach (msg) ->
        console.log.apply(console, [].concat(msg))
      console.log("")

    @verifyCypressExists()
      .then ->
        msgs.push([chalk.green("Cypress was found at this path.")])
        log()
      .catch (err) ->
        msgs.push([chalk.red.underline("Cypress was not found at this path.")])
        log()

  startXvfb: ->
    xvfb.startAsync().catch (err) ->
      console.log("")
      console.log(chalk.bgRed.white(" -Error- "))
      console.log(chalk.red.underline("Could not start Cypress headlessly. Your CI provider must support XVFB."))
      console.log("")
      process.exit(1)

  stopXvfb: ->
    xvfb.stopAsync()

  tryXvfb: (fn) ->
    xvfb.startAsync()
    .then(fn)
    .catch(fn)

  tryStopXvfb: (fn) ->
    xvfb.stopAsync()
    .then(fn)
    .catch(fn)

  needsXfvb: ->
    ## do we need xvfb to run?
    ##
    ## we only need xvfb on linux
    ## and when no process.env.DISPLAY is not
    os.platform() is "linux" and not process.env.DISPLAY

  exec: (args, options = {}) ->
    e = null

    new Promise (resolve, reject) =>
      exec = =>
        @verifyCypress(options)
        .then (pathToCypress) =>
          p = new Promise (resolve2, reject2) =>
            e = cp.exec [pathToCypress, args].join(" "), (err, stdout, stderr) =>
              return reject(err) if err

              @tryStopXvfb ->
                resolve(stdout)
          p
          .timeout(4000)
          .catch Promise.TimeoutError, ->
            e.kill()
            err = new Error
            err.versionNotObtained = true
            reject(err)

      @tryXvfb(exec)

  spawn: (args, options = {}) ->
    args = [].concat(args)

    needsXfvb = @needsXfvb()

    _.defaults options,
      verify: false
      detached: false
      stdio: [process.stdin, process.stdout, "ignore"]

    spawn = =>
      @verifyCypress().then (pathToCypress) =>
        if options.verify
          console.log(chalk.green("Cypress application is valid and should be okay to run:"), chalk.blue(@getPathToUserExecutable()))
          return process.exit()

        sp = cp.spawn pathToCypress, args, options
        if needsXfvb
          ## make sure we close down xvfb
          ## when our spawned process exits
          sp.on "close", @stopXvfb

        ## when our spawned process exits
        ## make sure we kill our own process
        ## with its exit code (to bubble up errors)
        sp.on "exit", process.exit

        if options.detached
          sp.unref()

        return sp

    if needsXfvb
      @startXvfb().then(spawn)
    else
      spawn()
}
