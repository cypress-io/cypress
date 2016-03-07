_        = require("lodash")
os       = require("os")
app      = require("electron").app
image    = require("electron").nativeImage
cyIcons  = require("cypress-icons")
Position = require("electron-positioner")
errors   = require("../errors")
Updater  = require("../updater")
logs     = require("../electron/handlers/logs")
Tray     = require("../electron/handlers/tray")
Events   = require("../electron/handlers/events")
Renderer = require("../electron/handlers/renderer")

module.exports = {
  onDrop: ->

  onClick: (bounds, win) ->
    positioner = new Position(win)

    coords = positioner.calculate("trayCenter", bounds)

    ## store the coords on updater
    Updater.setCoords(coords)

    win.setPosition(coords.x, coords.y)

    if win.isVisible()
      win.hide()
    else
      win.show()

  onRightClick: ->

  onWindowAllClosed: (app) ->
    ## stop all the events
    Events.stop()

    ## exit when all windows are closed
    app.exit(0)

  getRendererArgs: ->
    common = {
      width: 300
      height: 400
      resizable: false
      type: "INDEX"
      onBlur: ->
        return if @webContents.isDevToolsOpened()

        Renderer.hideAllUnlessAnotherWindowIsFocused()
      onFocus: ->
        Renderer.showAll()
    }

    _.extend(common, @platformArgs())

  platformArgs: ->
    {
      darwin: {
        show:        false
        frame:       false
        transparent: true
      }

      linux: {
        show:        true
        frame:       true
        transparent: false
        icon: image.createFromPath(cyIcons.getPathToIcon("icon_128x128.png"))
      }
    }[os.platform()]

  ready: (options = {}) ->
    options.app = app

    ## TODO:
    ## handle right click to show context menu!
    ## handle drop events for automatically adding projects!
    ## use the same icon as the cloud app
    Renderer.create(@getRendererArgs())
    .then (win) =>
      Events.start(options)

      Tray.display({
        onDrop: ->

        onClick: (e, bounds) =>
          @onClick(bounds, win)

        onRightClick: ->
    })

  run: (options) ->
    new Promise (resolve, reject) =>
      ## prevent chromium from throttling
      app.commandLine.appendSwitch("disable-renderer-backgrounding")

      app.on "window-all-closed", =>
        @onWindowAllClosed(app)

      app.on "ready", =>
        resolve @ready(options)
}