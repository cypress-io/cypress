fs       = require("fs-extra")
cp       = require("child_process")
path     = require("path")
Promise  = require("bluebird")
minimist = require("minimist")
paths    = require("./paths")
install  = require("./install")

fs = Promise.promisifyAll(fs)

module.exports = {
  install: ->
    install.run()

  cli: (argv = []) ->
    opts = minimist(argv)

    pathToApp = argv[0]

    switch
      when opts.install
        @install()
      when pathToApp
        @open(pathToApp)
      else
        throw new Error("No path to your app was provided.")

  open: (appPath) ->
    appPath = path.resolve(appPath)
    dest    = paths.getPathToResources("app")

    ## make sure this path exists!
    fs.statAsync(appPath)
    .then ->
      fs.ensureSymlinkAsync(appPath, dest, "dir")
      .then ->
        cp.spawn(paths.getPathToExec(), [], {stdio: "inherit"})
        .on "close", (code) ->
          process.exit(code)

    .catch (err) ->
      console.log(err.stack)
      process.exit(1)
}