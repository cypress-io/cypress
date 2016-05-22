_        = require("lodash")
os       = require("os")
app      = require("electron").app
image    = require("electron").nativeImage
Promise  = require("bluebird")
cyIcons  = require("@cypress/core-icons")
Position = require("electron-positioner")
notifier = require("node-notifier")
user     = require("../user")
errors   = require("../errors")
Updater  = require("../updater")
logs     = require("../electron/handlers/logs")
menu     = require("../electron/handlers/menu")
Tray     = require("../electron/handlers/tray")
Events   = require("../electron/handlers/events")
Renderer = require("../electron/handlers/renderer")

module.exports = {
  isMac: ->
    os.platform() is "darwin"

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

  getRendererArgs: (coords) ->
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

    ## if we have coordinates automatically add them
    if coords
      ## and also set show to true
      _.extend(common, coords, {show: true})

    return common

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

  notify: ->
    ## bail if we aren't on mac
    return if not @isMac()

    user.ensureSession()
    .catch ->
      notifier.notify({
        # subtitle:
        title: "Cypress is now running..."
        message: "Click the 'cy' icon in your tray to login."
        icon: cyIcons.getPathToIcon("icon_32x32@2x.png")
      })

  ready: (options = {}) ->
    tray = new Tray()

    menu.set()

    _.defaults options,
      onQuit: ->
        ## TODO: fix this. if the debug window
        ## is open and we attempt to quit
        ## it will not be closed because
        ## there is a memory reference
        ## thus we have to remove it first
        logs.off()

        ## exit the app immediately
        app.exit(0)

      onOpenProject: =>
        tray.setState("running")

      onCloseProject: =>
        tray.setState("default")

      onError: (err) =>
        tray.setState("error")

    ready = =>
      ## TODO:
      ## handle right click to show context menu!
      ## handle drop events for automatically adding projects!
      ## use the same icon as the cloud app
      Renderer.create(@getRendererArgs(options.coords))
      .then (win) =>
        Events.start(options)

        if options.updating
          Updater.install(options)

        tray.display({
          onClick: (e, bounds) =>
            @onClick(bounds, win)
        })

        return win

    Promise.props({
      ready: ready()
      notify: @notify()
    })
    .get("ready")

  run: (options) ->
    app.on "window-all-closed", =>
      @onWindowAllClosed(app)

    waitForReady = ->
      new Promise (resolve, reject) ->
        app.on "ready", resolve

    Promise.any([
      waitForReady()
      Promise.delay(500)
    ])
    .then =>
      @ready(options)
}
