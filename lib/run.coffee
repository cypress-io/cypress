require("./environment")

_        = require("lodash")
cp       = require("child_process")
path     = require("path")
argsUtil = require("./util/args")

currentlyRunningElectron = ->
  process.versions and process.versions.electron

runGui = (options) ->
  ## if we have the electron property on versions
  ## that means we're already running in electron
  ## like in production and we shouldn't spawn a new
  ## process
  if currentlyRunningElectron()
    ## just run the gui code directly here
    ## and pass our options directly to main
    require("./gui/main")(options)
  else
    ## we are in dev mode and can just run electron
    ## in our gui folder which kicks things off
    cp.spawn("electron", [path.join(__dirname, "gui")], {
      ## we are going to pass the options as CYPRESS_ARGS
      ## for our electron process to avoid doing this again
      env: _.extend({}, process.env, {CYPRESS_ARGS: JSON.stringify(options)})
      stdio: "inherit"
    })

runHeadless = (options) ->
  switch options.env
    when "development"
      args = {}

      if options.debug
        args.debug = "--debug"

      _.extend(args, {
        script: "lib/cypress.coffee"
        watch: ["--watch", "lib"]
        ignore: ["--ignore", "lib/public"]
        verbose: "--verbose"
        exts: ["-e", "coffee,js"]
        args: ["--", options.project]
      })

      args = _.chain(args).values().flatten().value()

      cp.spawn("nodemon", args, {stdio: "inherit"})

      if options.debug
        cp.spawn("node-inspector", [], {stdio: "inherit"})

        require("open")("http://127.0.0.1:8080/debug?ws=127.0.0.1:8080&port=5858")

    when "production"
      console.log "production"

    else
      throw new Error("Missing options.env. Must have this value to run Cypress headlessly!")

module.exports = (argv) ->
  options = argsUtil.toObject(argv)

  ## if we are in smokeTest mode
  ## then just output the pong's value
  ## and exit
  if options.smokeTest
    process.stdout.write(options.pong + "\n")
    return process.exit()

  ## if we are in returnPackage mode
  ## then just output our package's value
  ## and exist
  if options.returnPkg
    manifest = JSON.stringify(App.config.getManifest())
    process.stdout.write(manifest + "\n")
    return process.exit()

  if options.env is "production"
    ## start in gui mode by default
    options.gui = true

  if options.gui
    ## spawn the electron gui process
    runGui(options)
  else
    ## spawn nodemon to run headlessly in server mode
    runHeadless(options)