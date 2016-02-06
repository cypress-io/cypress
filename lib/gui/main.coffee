app        = require("electron").app
init       = require("./handlers/init")

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

  app.on "window-all-closed", ->
    init.onWindowAllClosed(app)

    ## exit when all windows are closed.
    app.exit(0)

  ## This method will be called when Electron has finished
  ## initialization and is ready to create browser windows.
  app.on "ready", ->
    if options.headless
      init.runHeadless(app, options)
    else
      init.runHeaded(app, options)