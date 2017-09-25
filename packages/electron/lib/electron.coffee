fs       = require("fs-extra")
cp       = require("child_process")
path     = require("path")
Promise  = require("bluebird")
minimist = require("minimist")
paths    = require("./paths")
install  = require("./install")
log      = require("debug")("cypress:electron")

fs = Promise.promisifyAll(fs)

module.exports = {
  installIfNeeded: ->
    install.check()

  install:  ->
    log("installing %j", arguments)
    install.package.apply(install, arguments)

  cli: (argv = []) ->
    opts = minimist(argv)
    log("cli options %j", opts)

    pathToApp = argv[0]

    switch
      when opts.install
        @installIfNeeded()
      when pathToApp
        @open(pathToApp, argv)
      else
        throw new Error("No path to your app was provided.")

  open: (appPath, argv, cb) ->
    log("opening %s", appPath)
    appPath = path.resolve(appPath)
    dest    = paths.getPathToResources("app")
    log("appPath %s", appPath)
    log("dest path %s", dest)

    ## make sure this path exists!
    fs.statAsync(appPath)
    .then ->
      log("appPath exists %s", appPath)
      ## clear out the existing symlink
      fs.removeAsync(dest)
    .then ->
      symlinkType = paths.getSymlinkType()
      log("making symlink from %s to %s of type %s", appPath, dest, symlinkType)
      fs.ensureSymlinkAsync(appPath, dest, symlinkType)
    .then ->
      execPath = paths.getPathToExec()
      log("spawning %s", execPath)
      cp.spawn(execPath, argv, {stdio: "inherit"})
      .on "close", (code) ->
        if cb
          cb(code)
        else
          process.exit(code)

    .catch (err) ->
      console.log(err.stack)
      process.exit(1)
}
