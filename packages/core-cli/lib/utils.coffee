_        = require("lodash")
cp       = require("child_process")
os       = require("os")
fs       = require("fs-extra")
path     = require("path")
chalk    = require("chalk")
Xvfb     = require("xvfb")
Promise  = require("bluebird")

fs   = Promise.promisifyAll(fs)
xvfb = Promise.promisifyAll(new Xvfb({silent: true}))

## TODO: things in here are broken for the moment because they were
## moved to root of repo, need to require("lib/install/utils") and use

module.exports = {
  xvfb: xvfb

  getPathToUserExecutable: ->
    path.join(@getDefaultAppFolder(), @getPlatformExecutable().split("/")[0])

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
