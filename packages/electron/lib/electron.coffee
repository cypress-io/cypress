fs       = require("fs-extra")
cp       = require("child_process")
path     = require("path")
Promise  = require("bluebird")
minimist = require("minimist")
paths    = require("./paths")
install  = require("./install")

fs = Promise.promisifyAll(fs)

module.exports = {
  installIfNeeded: ->
    install.check()

  install:  ->
    install.package.apply(install, arguments)

  cli: (argv = []) ->
    opts = minimist(argv)

    pathToApp = argv[0]

    switch
      when opts.install
        @installIfNeeded()
      when pathToApp
        @open(pathToApp, argv)
      else
        throw new Error("No path to your app was provided.")

  open: (appPath, argv, cb) ->
    appPath = path.resolve(appPath)
    dest    = paths.getPathToResources("app")

    ## make sure this path exists!
    fs.statAsync(appPath)
    .then ->
      ## clear out the existing symlink
      fs.removeAsync(dest)
    .then ->
      fs.ensureSymlinkAsync(appPath, dest, "dir")
    .then ->
      cp.spawn(paths.getPathToExec(), argv, {stdio: "inherit"})
      .on "close", (code) ->
        if cb
          cb(code)
        else
          process.exit(code)

    .catch (err) ->
      console.log(err.stack)
      process.exit(1)
}
