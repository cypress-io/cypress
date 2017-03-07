_          = require("lodash")
os         = require("os")
EE         = require("events")
app        = require("electron").app
image      = require("electron").nativeImage
Promise    = require("bluebird")
cyIcons    = require("@cypress/core-icons")
Position   = require("electron-positioner")
user       = require("../user")
errors     = require("../errors")
savedState = require("../saved_state")
Updater    = require("../updater")
logs       = require("../electron/handlers/logs")
menu       = require("../electron/handlers/menu")
Events     = require("../electron/handlers/events")
Renderer   = require("../electron/handlers/renderer")

module.exports = {
  isMac: ->
    os.platform() is "darwin"

  onWindowAllClosed: (app) ->
    process.exit(0)

  getRendererArgs: (state) ->
    common = {
      backgroundColor: "#dfe2e4"
      width: state.appWidth or 800
      height: state.appHeight or 550
      minWidth: 458
      minHeight: 400
      x: state.appX
      y: state.appY
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

    savedState.get().then (state) =>
      Renderer.create(@getRendererArgs(state)).then (win) =>
        ## cause the browser window instance
        ## to receive focus when we"ve been
        ## told to focus on the tests!
        options.onFocusTests = ->
          win.focus()

        Events.start(options, bus)

        if options.updating
          Updater.install(options)

        win.on "resize", _.debounce ->
          [width, height] = win.getSize()
          [x, y] = win.getPosition()
          savedState.set({
            appWidth: width
            appHeight: height
            appX: x
            appY: y
          })
        , 500

        win.on "moved", _.debounce ->
          [x, y] = win.getPosition()
          savedState.set({
            appX: x
            appY: y
          })
        , 500

        if state.isAppDevToolsOpen
          win.webContents.openDevTools()

        win.webContents.on "devtools-opened", ->
          savedState.set({ isAppDevToolsOpen: true })

        win.webContents.on "devtools-closed", ->
          savedState.set({ isAppDevToolsOpen: false })

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
