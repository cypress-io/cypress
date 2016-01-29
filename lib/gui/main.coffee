app        = require("electron").app
Tray       = require("./handlers/tray")
Events     = require("./handlers/events")
Renderer   = require("./handlers/renderer")

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

  ## exit when all windows are closed.
  app.on "window-all-closed", ->
    Events.stop()

    app.exit(0)

  ## This method will be called when Electron has finished
  ## initialization and is ready to create browser windows.
  app.on "ready", ->
    ## display the tray
    Tray.display()

    ## handle right click to show context menu!
    ## handle drop events for automatically adding projects!
    ## use the same icon as the cloud app

    Events.start(options)

    Renderer.create({
      width: 1280
      height: 720
      type: "INDEX"
    })