require("./environment")

## we are not requiring everything up front
## to optimize how quickly electron boots while
## in dev or linux production. the reasoning is
## that we likely may need to spawn a new child process
## and its a huge waste of time (about 1.5secs) of
## synchronous requires the first go around just to
## essentially do it all again when we boot the correct
## mode.

_       = require("lodash")
cp      = require("child_process")
os      = require("os")
path    = require("path")
Promise = require("bluebird")
debug   = require("debug")("cypress:server:cypress")

warning = (code) ->
  require("./errors").warning(code)

exit = (code = 0) ->
  ## TODO: we shouldn't have to do this
  ## but cannot figure out how null is
  ## being passed into exit
  debug("about to exit with code", code)
  process.exit(code)

exit0 = ->
  exit(0)

exitErr = (err) ->
  ## log errors to the console
  ## and potentially raygun
  ## and exit with 1
  debug('exiting with err', err)

  require("./errors").logException(err)
  .then -> exit(1)

module.exports = {
  isCurrentlyRunningElectron: ->
    !!(process.versions and process.versions.electron)

  runElectron: (mode, options) ->
    ## wrap all of this in a promise to force the
    ## promise interface - even if it doesn't matter
    ## in dev mode due to cp.spawn
    Promise.try =>
      ## if we have the electron property on versions
      ## that means we're already running in electron
      ## like in production and we shouldn't spawn a new
      ## process
      if @isCurrentlyRunningElectron()
        ## if we weren't invoked from the CLI
        ## then display a warning to the user
        if not options.invokedFromCli
          warning("INVOKED_BINARY_OUTSIDE_NPM_MODULE")
        
        ## just run the gui code directly here
        ## and pass our options directly to main
        debug("running Electron currently")
        require("./modes")(mode, options)
      else
        new Promise (resolve) ->
          debug("starting Electron")
          cypressElectron = require("@packages/electron")

          fn = (code) ->
            ## juggle up the totalFailed since our outer
            ## promise is expecting this object structure
            debug("electron finished with", code)

            if mode is "smokeTest"
              return resolve(code)

            resolve({totalFailed: code})

          args = require("./util/args").toArray(options)
          debug("electron open arguments %o", args)
          cypressElectron.open(".", args, fn)

  openProject: (options) ->
    ## this code actually starts a project
    ## and is spawned from nodemon
    require("./open_project").open(options.project, options)

  runServer: (options) ->
    # args = {}
    #
    # _.defaults options, { autoOpen: true }
    #
    # if not options.project
    #   throw new Error("Missing path to project:\n\nPlease pass 'npm run server -- --project /path/to/project'\n\n")
    #
    # if options.debug
    #   args.debug = "--debug"
    #
    # ## just spawn our own index.js file again
    # ## but put ourselves in project mode so
    # ## we actually boot a project!
    # _.extend(args, {
    #   script:  "index.js"
    #   watch:  ["--watch", "lib"]
    #   ignore: ["--ignore", "lib/public"]
    #   verbose: "--verbose"
    #   exts:   ["-e", "coffee,js"]
    #   args:   ["--", "--config", "port=2020", "--mode", "openProject", "--project", options.project]
    # })
    #
    # args = _.chain(args).values().flatten().value()
    #
    # cp.spawn("nodemon", args, {stdio: "inherit"})
    #
    # ## auto open in dev mode directly to our
    # ## default cypress web app client
    # if options.autoOpen
    #   _.delay ->
    #     require("./browsers").launch("chrome", "http://localhost:2020/__", {
    #       proxyServer: "http://localhost:2020"
    #     })
    #   , 2000
    #
    # if options.debug
    #   cp.spawn("node-inspector", [], {stdio: "inherit"})
    #
    #   require("opn")("http://127.0.0.1:8080/debug?ws=127.0.0.1:8080&port=5858")

  start: (argv = []) ->
    debug("starting cypress with argv %o", argv)

    options = require("./util/args").toObject(argv)

    if options.runProject and not options.headed
      # scale the electron browser window
      # to force retina screens to not
      # upsample their images when offscreen
      # rendering
      require("./util/electron_app").scale()

    ## make sure we have the appData folder
    require("./util/app_data").ensure()
    .then =>
      ## else determine the mode by
      ## the passed in arguments / options
      ## and normalize this mode
      mode = switch
        when options.version
          "version"

        when options.smokeTest
          "smokeTest"

        when options.returnPkg
          "returnPkg"

        when options.logs
          "logs"

        when options.clearLogs
          "clearLogs"

        when options.getKey
          "getKey"

        when options.generateKey
          "generateKey"

        when options.exitWithCode?
          "exitWithCode"

        when options.runProject
          ## go into headless mode when running
          ## until completion + exit
          "run"

        else
          ## set the default mode as interactive
          options.mode or "interactive"

      @startInMode(mode, options)

  startInMode: (mode, options) ->
    debug("starting in mode %s", mode)

    switch mode
      when "version"
        require("./modes/pkg")(options)
        .get("version")
        .then (version) ->
          console.log(version)
        .then(exit0)
        .catch(exitErr)

      when "smokeTest"
        @runElectron(mode, options)
        .then (pong) =>
          if not @isCurrentlyRunningElectron()
            return pong

          if pong is options.ping
            return 0

          return 1
        .then(exit)
        .catch(exitErr)

      when "returnPkg"
        require("./modes/pkg")(options)
        .then (pkg) ->
          console.log(JSON.stringify(pkg))
        .then(exit0)
        .catch(exitErr)

      when "logs"
        ## print the logs + exit
        require("./gui/logs").print()
        .then(exit0)
        .catch(exitErr)

      when "clearLogs"
        ## clear the logs + exit
        require("./gui/logs").clear()
        .then(exit0)
        .catch(exitErr)

      when "getKey"
        ## print the key + exit
        require("./project").getSecretKeyByPath(options.projectRoot)
        .then (key) ->
          console.log(key)
        .then(exit0)
        .catch(exitErr)

      when "generateKey"
        ## generate + print the key + exit
        require("./project").generateSecretKeyByPath(options.projectRoot)
        .then (key) ->
          console.log(key)
        .then(exit0)
        .catch(exitErr)

      when "exitWithCode"
        require("./modes/exit")(options)
        .then(exit)
        .catch(exitErr)

      when "run"
        ## run headlessly and exit
        ## with num of totalFailed
        @runElectron(mode, options)
        .get("totalFailed")
        .then(exit)
        .catch(exitErr)

      when "interactive"
        @runElectron(mode, options)

      when "server"
        @runServer(options)

      when "openProject"
        ## open + start the project
        @openProject(options)

      else
        throw new Error("Cannot start. Invalid mode: '#{mode}'")
}
