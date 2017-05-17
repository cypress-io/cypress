_          = require("lodash")
os         = require("os")
EE         = require("events")
app        = require("electron").app
image      = require("electron").nativeImage
Promise    = require("bluebird")
cyIcons    = require("@cypress/icons")
Position   = require("electron-positioner")
user       = require("../user")
errors     = require("../errors")
savedState = require("../saved_state")
Updater    = require("../updater")
logs       = require("../gui/logs")
menu       = require("../gui/menu")
Events     = require("../gui/events")
Windows    = require("../gui/windows")

isDev = ->
  process.env["CYPRESS_ENV"] is "development"

module.exports = {
  isMac: ->
    os.platform() is "darwin"

  getWindowArgs: (state) ->
    common = {
      backgroundColor: "#dfe2e4"
      width: state.appWidth or 800
      height: state.appHeight or 550
      minWidth: 458
      minHeight: 400
      x: state.appX
      y: state.appY
      type: "INDEX"
      devTools: state.isAppDevToolsOpen
      trackState: {
        width: "appWidth"
        height: "appHeight"
        x: "appX"
        y: "appY"
        devTools: "isAppDevToolsOpen"
      }
      onBlur: ->
        return if @webContents.isDevToolsOpened()

        Windows.hideAllUnlessAnotherWindowIsFocused()
      onFocus: ->
        ## hide dev tools if in production and previously focused
        ## window was the electron browser
        menu.set({withDevTools: isDev()})
        Windows.showAll()
      onClose: ->
        process.exit()
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
      withDevTools: isDev()
      onUpdatesClicked: ->
        bus.emit("menu:item:clicked", "check:for:updates")

      onLogOutClicked: ->
        bus.emit("menu:item:clicked", "log:out")
    })

    savedState.get()
    .then (state) =>
      Windows.open(@getWindowArgs(state))
      .then (win) =>
        ## cause the browser window instance
        ## to receive focus when we"ve been
        ## told to focus on the tests!
        options.onFocusTests = ->
          win.focus()

        Events.start(options, bus)

        if options.updating
          Updater.install(options)

        return win

  run: (options) ->
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
