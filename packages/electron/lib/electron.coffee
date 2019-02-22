fs       = require("fs-extra")
cp       = require("child_process")
path     = require("path")
debug    = require("debug")("cypress:electron")
Promise  = require("bluebird")
minimist = require("minimist")
inspector = require("inspector")
paths    = require("./paths")
install  = require("./install")

fs = Promise.promisifyAll(fs)

module.exports = {
  installIfNeeded: ->
    install.check()

  install:  ->
    debug("installing %j", arguments)

    install.package.apply(install, arguments)

  cli: (argv = []) ->
    opts = minimist(argv)

    debug("cli options %j", opts)

    pathToApp = argv[0]

    switch
      when opts.install
        @installIfNeeded()
      when pathToApp
        @open(pathToApp, argv)
      else
        throw new Error("No path to your app was provided.")

  open: (appPath, argv, cb) ->
    debug("opening %s", appPath)

    appPath = path.resolve(appPath)
    dest    = paths.getPathToResources("app")

    debug("appPath %s", appPath)
    debug("dest path %s", dest)

    ## make sure this path exists!
    fs.statAsync(appPath)
    .then ->
      debug("appPath exists %s", appPath)

      ## clear out the existing symlink
      fs.removeAsync(dest)
    .then ->
      symlinkType = paths.getSymlinkType()

      debug("making symlink from %s to %s of type %s", appPath, dest, symlinkType)

      fs.ensureSymlinkAsync(appPath, dest, symlinkType)
    .then ->
      execPath = paths.getPathToExec()

      ## we have an active debugger session
      if inspector.url()
        dp = process.debugPort + 1

        argv.unshift("--inspect-brk=#{dp}")

      else
        opts = minimist(argv)
        if opts.inspectBrk
          argv.unshift("--inspect-brk=5566")

      if proxyServer = process.env.HTTP_PROXY
        ## need to use the environment proxy in Electron so the embedded GitHub login will work
        argv.push("--proxy-server=#{proxyServer}")

      if proxyBypassList = process.env.NO_PROXY
        proxyBypassList = proxyBypassList.split(',').join(';')
        argv.push("--proxy-bypass-list=#{proxyBypassList}")

      debug("spawning %s with args", execPath, argv)

      cp.spawn(execPath, argv, {stdio: "inherit"})
      .on "close", (code) ->
        debug("electron closing with code", code)

        if code
          debug("original command was")
          debug(execPath, argv.join(" "))

        if cb
          debug("calling callback with code", code)
          cb(code)

        else
          debug("process.exit with code", code)
          process.exit(code)
    .catch (err) ->
      console.debug(err.stack)
      process.exit(1)
}
