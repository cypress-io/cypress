_       = require("lodash")
os      = require("os")
cp      = require("child_process")
path    = require("path")
util    = require("util")
kill    = require("tree-kill")
chalk   = require("chalk")
request = require("request-promise")
Promise = require("bluebird")
fs      = require("fs-extra")
git     = require("gift")

fs = Promise.promisifyAll(fs)

log = ->
  msg = util.format.apply(util, arguments)
  process.stdout.write(msg + "\n")

patchGlobalConsoleLog = ->
  if global.console.log isnt log
    global.console.log = log

write = (str) ->
  process.stdout.write(str + "\n")

writeErr = (str, msgs...) ->
  str = [chalk.red(str)].concat(msgs).join(" ")
  write(str)
  process.exit(1)

  ## since we normally stub out exit we need to
  ## throw the str here so our test code's promises
  ## do what they're supposed to do!
  if process.env["CYPRESS_ENV"] isnt "production"
    throw str

SecretSauce =
  mixin: (module, klass) ->
    for key, fn of @[module]
      klass.prototype[key] = fn

SecretSauce.Cli = (App, options, Routes, Chromium, Reporter, Log) ->
  repo = Promise.promisifyAll git(options.projectPath)

  displayToken = (token) ->
    write(token)
    process.exit()

  displayError = (err) ->
    switch
      when err.projectNotFound
        writeErr("Sorry, could not retreive project key because no project was found:", chalk.blue(err.projectPath))
      when err.specNotFound
        writeErr("Sorry, could not run this specific spec because it was not found:", chalk.blue(err.specPath))
      when err.portInUse
        writeErr("Sorry, could not run this project because this port is currently in use:", chalk.blue(err.port), chalk.yellow("\nSpecify a different port with the '--port <port>' argument or shut down the other process using this port."))
      when err.chromiumFailedLoadingCypress
        writeErr("Sorry, there was an error loading Cypress.", chalk.yellow("\nerrorCode:", chalk.blue(err.errorCode)), chalk.yellow("\nerrorDescription:", chalk.blue(err.errorDescription)))
      when err.testsDidNotStart
        writeErr("Sorry, there was an error while attempting to start your tests. The remote client never connected.")
      when err.couldNotSpawnChromium
        writeErr("Sorry, there was an error spawning Chromium.", chalk.yellow("\n" + err.message))
      else
        writeErr("An error occured receiving token.")

  ensureCiEnv = (user) ->
    return true if ensureNoSessionToken(user) and ensureLinuxEnv()

    writeErr("Sorry, running in CI requires a valid CI provider and environment.")

  getBranchFromGit = ->
    repo.branchAsync()
      .get("name")
      .catch -> ""

  getMessage = ->
    repo.current_commitAsync()
      .get("message")
      .catch -> ""

  getAuthor = ->
    repo.current_commitAsync()
      .get("author")
      .get("name")
      .catch -> ""

  getBranch = ->
    for branch in ["CIRCLE_BRANCH", "TRAVIS_BRANCH", "CI_BRANCH"]
      if b = process.env[branch]
        return Promise.resolve(b)

    getBranchFromGit()

  ensureProjectAPIToken = (projectId, key, fn) ->
    Promise.props({
      branch: getBranch()
      author: getAuthor()
      message: getMessage()
    })
    .then (git) ->
      request.post({
        url: Routes.ci(projectId)
        headers: {
          "x-project-token": key
          "x-git-branch":    git.branch
          "x-git-author":    git.author
          "x-git-message":   git.message
        }
        json: true
      })
      .then (attrs) ->
        attrs.ci_guid
      .catch (err) ->
        writeErr("Sorry, your project's API Key: '#{key}' was not valid. This project cannot run in CI.")
    .then(fn)

  ensureLinuxEnv = ->
    return true if os.platform() is "linux"

  ensureNoSessionToken = (user) ->
    ## bail if we DO have a session token
    return true unless user.get("session_token")

  ensureSessionToken = (user) ->
    ## bail if we have a session_token
    return true if user.get("session_token")

    ## else die and log out the auth error
    writeErr("Sorry, you are not currently logged into Cypress. This request requires authentication.\nPlease log into Cypress and then issue this command again.")

  ## think about publicly attaching this class
  ## to the CLI object (in test env) so we can test
  ## it easier without doing NW integration tests
  class Cli
    constructor: (@App, options = {}) ->
      @user = @App.currentUser

      @parseCliOptions(options)

    parseCliOptions: (options) ->
      switch
        when options.logs         then @logs(options)
        when options.clearLogs    then @clearLogs(options)
        when options.ci           then @ci(options)
        when options.getKey       then @getKey(options)
        when options.generateKey  then @generateKey(options)
        # when options.openProject  then @openProject(user, options)
        when options.runProject   then @runProject(options)
        when options.getChromiumVersion then @getChromiumVersion(options)
        else
          @startGuiApp(options)

    getOsPathToChromiumBin: ->
      switch process.platform
        when "darwin" then "./bin/chromium/Chromium.app/Contents/MacOS/Electron"
        when "linux"  then "./bin/chromium/Chromium"

    getChromiumOptions: ->
      opts = {}

      if process.env["CYPRESS_ENV"] is "production"
        opts.cmd = @getOsPathToChromiumBin()
        opts.args = ["--"]
      else
        opts.cmd = "electron"
        opts.cwd = path.join(process.cwd(), "..", "cypress-chromium")
        opts.args = ["."]

      opts

    getChromiumVersion: ->
      opts = @getChromiumOptions()
      opts.stdio = "inherit"
      opts.args.push("--version")

      sp = cp.spawn opts.cmd, opts.args, opts

      sp.on "error", (err) ->
        err.couldNotSpawnChromium = true

        ## log out the error to the console if we're not in production
        if process.env["CYPRESS_ENV"] isnt "production"
          process.stdout.write(JSON.stringify(err) + "\n")

        displayError(err)

      sp.on "close", (code) ->
        process.exit(code)

    clearLogs: ->
      Log.clearLogs().then ->
        process.exit()

    logs: ->
      Log.getLogs().then (logs) ->
        _.each logs, (log, i) ->
          str   = JSON.stringify(log)
          color = if i % 2 is 0 then "cyan" else "yellow"
          write chalk[color](str)

        process.exit()

    getKey: ->
      if ensureSessionToken(@user)

        ## log out the API Token
        @App.config.getProjectToken(@user, options.projectPath)
          .then(displayToken)
          .catch(displayError)

    generateKey: ->
      if ensureSessionToken(@user)

        ## generate a new API Token
        @App.config.generateProjectToken(@user, options.projectPath)
          .then(displayToken)
          .catch(displayError)

    getSrc: (clientUrl, spec) ->
      [clientUrl, "#/tests/", spec, "?__ui=satellite"].join("")

    getSpec: (config, options) ->
      spec = options.spec

      ## if we dont have a specific spec resolve with __all
      return Promise.resolve(@getSrc(config.clientUrl, "__all")) if not spec

      specFile = path.join(options.projectPath, config.testFolder, spec)

      fs.statAsync(specFile)
        .bind(@)
        .then ->
          @getSrc(config.clientUrl, spec)
        .catch (err) ->
          e = new Error
          e.specNotFound = true
          e.specPath = specFile
          throw e

    run: (options) ->
      ## silence all console messages
      @App.silenceConsole()

      id = Math.random()

      reporter = Reporter()

      connected = false
      sp        = null

      killChromium = (fn = ->) ->
        kill sp.pid, "SIGKILL", fn

      p = new Promise (resolve, reject) =>

        @App.vent.trigger "start:projects:app", {
          morgan:      false
          isHeadless:  true
          idGenerator: !options.ci ## if we are in CI dont use IDGenerator
          socketId:    id
          projectPath: options.projectPath
          port:        options.port
          onError:     displayError
          environmentVariables: options.environmentVariables
          # onAppError: (err) ->
            # writeErr(err)

          onResolve: ->
            resolve()

          onConnect: (socketId, socket) ->
            patchGlobalConsoleLog()

            ## if this id is correct and this socket
            ## isnt being tracked yet then add it
            if id is socketId
              if not connected
                ## resolve our promise that we became
                ## connected so it doesnt time out
                @onResolve()
                connected = true

              socket.on "mocha", (event, args...) ->
                args = [event].concat(args)
                reporter.emit.apply(reporter, args)

                if event is "end"
                  stats = reporter.stats()
                  # console.log(stats)

                  killChromium (err) ->
                    process.exit(stats.failures)

          onProjectStart: (config) =>
            @getSpec(config, options)
              .then (src) =>
                patchGlobalConsoleLog()

                console.log("\nTests should begin momentarily...\n")

                o = @getChromiumOptions()
                o.args.push("--url=#{src}")

                sp = cp.spawn o.cmd, o.args, o

                # sp.stdout.on "data", (data) ->
                #   if data.toString() is "did-finish-load"
                #     ## check to ensure there are no App.error
                #     ## if there are exit and log out the error
                #     # process.stdout.write("data is: #{data}")
                #     config.checkForAppErrors()

                ## Chromium will output data on stderr
                ## on 'did-fail-load' events
                sp.stderr.on "data", (data) ->
                  try
                    obj = JSON.parse(data)

                    ## bail if we arent the stderror coming from chromium
                    return if not (obj.hasOwnProperty("errorCode") or obj.hasOwnProperty("errorDescription"))

                    err = new Error
                    err.chromiumFailedLoadingCypress = true
                    err.errorCode = obj.errorCode
                    err.errorDescription = obj.errorDescription

                    displayError(err)

                # @App.execute "start:chromium:run", src, {
                #   headless:    true
                #   onReady: (win) ->
                #     Chromium(win).override({
                #       ci:          options.ci
                #       reporter:    options.reporter
                #       ci_guid:     options.ci_guid
                #     })
                # }
              .catch(displayError)

          onProjectNotFound: (path) ->
            ## instead of throwing we should prompt the user with inquirer
            ## hey this project hasn't ever been added to cypress, would you
            ## like to add this project?
            ## YES/NO
            ## --adding project--
            ## --project added!--

            writeErr("Sorry, could not run project because it was not found:", chalk.blue(path))
        }

      ## allow up to 10 seconds for our promise to resolve
      ## when the client application connects. if we dont
      ## resolve in time then kill all chromium processes
      p
      .timeout(10000)
      .catch Promise.TimeoutError, (err) ->
        err.testsDidNotStart = true

        killChromium ->
          displayError(err)

    runProject: (options) ->
      if ensureSessionToken(@user)
        @run(options)

    removeProject: (options) ->
      ## This project has been removed: path/to/project

    addProject: (projectPath) ->
      ## check if this project is already added
      ## if so, exit with "This project has already been added."
      ## say This project has been successfully added: path/to/project
      @App.config.addProject(projectPath)

    ci: (options) ->
      ## 1. no session
      ## 2. linux env
      ## 3. project API key
      ## 4. TODO travis ci
      ## 5. free/paid project
      {projectPath} = options

      if ensureCiEnv(@user)
        @addProject(projectPath).then =>
          @App.config.getProjectIdByPath(projectPath).then (projectId) =>
            ensureProjectAPIToken projectId, options.key, (ci_guid) =>
              options.ci_guid = ci_guid
              @run(options)

    startGuiApp: (options) ->
      if options.session
        ## if have it, start projects and pass up port + environmentVariables
        @App.vent.trigger "start:projects:app", _.pick(options, "port", "environmentVariables")
      else
        ## else login
        @App.vent.trigger "start:login:app"

      ## display the footer
      @App.vent.trigger "start:footer:app"

      ## display the GUI
      @App.execute "gui:display", options.coords

  new Cli(App, options)

if module?
  module.exports = SecretSauce
else
  SecretSauce
