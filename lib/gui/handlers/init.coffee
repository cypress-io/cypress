Tray       = require("./tray")
Events     = require("./events")
Renderer   = require("./renderer")

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

    ## set these coords on the updater
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

  getWindow: (renderer) ->
    Promise.resolve(renderer)

  onReady: (app, options = {}) ->
    ## handle right click to show context menu!
    ## handle drop events for automatically adding projects!
    ## use the same icon as the cloud app
    Renderer.create({
      width: 300
      height: 400
      resizable: false
      frame: false
      # devTools: true
      transparent: true
      # backgroundColor: "#FFFFFFFF"
      type: "INDEX"
      onBlur: ->
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
}