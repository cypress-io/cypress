_        = require("lodash")
os       = require("os")
EE       = require("events")
app      = require("electron").app
image    = require("electron").nativeImage
Promise  = require("bluebird")
cyIcons  = require("@cypress/core-icons")
Position = require("electron-positioner")
user     = require("../user")
errors   = require("../errors")
Updater  = require("../updater")
logs     = require("../electron/handlers/logs")
menu     = require("../electron/handlers/menu")
Events   = require("../electron/handlers/events")
Renderer = require("../electron/handlers/renderer")

module.exports = {
  isMac: ->
    os.platform() is "darwin"

  onWindowAllClosed: (app) ->
    process.exit(0)

  getRendererArgs: (coords) ->
    common = {
      backgroundColor: '#dfe2e4'
      width: 800
      height: 550
      minWidth: 458
      minHeight: 400
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
        show:        true
        frame:       true
        transparent: false
      }

      linux: {
        show:        true
        frame:       true
        transparent: false
        icon: image.createFromPath(cyIcons.getPathToIcon("icon_128x128.png"))
      }
    }[os.platform()]

  ready: (options = {}) ->
    bus = new EE

    ## TODO: potentially just pass an event emitter
    ## instance here instead of callback functions
    menu.set({
      onUpdatesClicked: ->
        bus.emit("menu:item:clicked", "check:for:updates")

      onLogOutClicked: ->
        bus.emit("menu:item:clicked", "log:out")
    })

    ## TODO:
    ## handle right click to show context menu!
    ## handle drop events for automatically adding projects!
    ## use the same icon as the cloud app
    Renderer.create(@getRendererArgs(options.coords))
    .then (win) =>
      ## cause the browser window instance
      ## to receive focus when we've been
      ## told to focus on the tests!
      options.onFocusTests = ->
        win.focus()

      Events.start(options, bus)

      if options.updating
        Updater.install(options)

      return win

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
