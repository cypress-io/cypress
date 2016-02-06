app      = require("electron").app
key      = require("./handlers/key")
logs     = require("./handlers/logs")
headed   = require("./handlers/headed")
headless = require("./handlers/headless")

## prevent chromium from throttling
app.commandLine.appendSwitch("disable-renderer-backgrounding")

module.exports = (optionsOrArgv) ->
  ## if we've been passed an array of argv
  ## this means we are in development
  ## mode and need to parse the args again
  if Array.isArray(optionsOrArgv)
    if not cyArgs = process.env.CYPRESS_ARGS
      throw new Error("No env vars found for: 'CYPRESS_ARGS'")

    ## parse the cypress args
    options = JSON.parse(cyArgs)
  else
    options = optionsOrArgv

  ## reuse exit function to kill the app
  ## process with default status code of 0
  exit = ->
    app.exit(0)

  app.on "window-all-closed", ->
    if options.headless isnt true
      headed.onWindowAllClosed(app)

    ## exit when all windows are closed.
    exit()

  ## This method will be called when Electron has finished
  ## initialization and is ready to create browser windows.
  app.on "ready", ->
    switch
      when options.logs
        ## print the logs + exit
        logs.print().then(exit)

      when options.clearLogs
        ## clear the logs + exit
        logs.clear().then(exit)

      when options.getKey
        ## print the key + exit
        key.print(options.projectPath).then(exit)

      when options.generateKey
        ## generate + print the key + exit
        key.generate(options.projectPath).then(exit)

      when options.headless
        ## run headlessly and exit
        headless.run(app, options).then(exit)

      else
        headed.run(app, options)