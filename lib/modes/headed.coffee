app      = require("electron").app
key      = require("../key")
errors   = require("../errors")
logs     = require("../electron/handlers/logs")
Tray     = require("../electron/handlers/tray")
Events   = require("../electron/handlers/events")
Renderer = require("../electron/handlers/renderer")

module.exports = {
  onDrop: ->

  onClick: (bounds, win) ->
    iconWidth = bounds.width

    translate = (coords) ->
      winWidth = win.getBounds().width

      coords.x -= Math.floor (winWidth / 2) - (iconWidth / 2)
      coords.y = 0
      coords

    coords = translate(bounds)

    ## TODO: where to store these?
    # App.updater.setCoords(coords) if App.updater

    win.setPosition(coords.x, coords.y)

    if win.isVisible()
      # win.webContents.send("hide")
      win.hide()
    else
      win.show()

  onRightClick: ->

  onWindowAllClosed: (app) ->
    ## stop all the events
    Events.stop()

    ## exit when all windows are closed
    app.exit(0)

  ready: (app, options = {}) ->
    options.app = app

    ## handle right click to show context menu!
    ## handle drop events for automatically adding projects!
    ## use the same icon as the cloud app
    Renderer.create({
      width: 300
      height: 400
      resizable: false
      frame: false
      ## show: handle dev env vs prod env and handle linux vs mac
      # devTools: true
      transparent: true
      # backgroundColor: "#FFFFFFFF"
      type: "INDEX"
      onBlur: ->
        return if @webContents.isDevToolsOpened()

        Renderer.hideAllUnlessAnotherWindowIsFocused()
      onFocus: ->
        Renderer.showAll()
    })
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