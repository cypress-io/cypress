app      = require("electron").app
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
  exit = (code = 0) ->
    app.exit(code)

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
        logs.print().then(exit)

      when options.clearLogs
        logs.clear().then(exit)

      when options.headless
        headless.run(app, options)

      else
        headed.run(app, options)