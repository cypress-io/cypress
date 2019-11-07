_          = require("lodash")
os         = require("os")
EE         = require("events")
app        = require("electron").app
image      = require("electron").nativeImage
Promise    = require("bluebird")
cyIcons    = require("@cypress/icons")
user       = require("../user")
errors     = require("../errors")
savedState = require("../saved_state")
logs       = require("../gui/logs")
menu       = require("../gui/menu")
Events     = require("../gui/events")
Windows    = require("../gui/windows")

isDev = ->
  process.env["CYPRESS_ENV"] is "development"

module.exports = {
  isMac: ->
    os.platform() is "darwin"

  getWindowArgs: (state, options = {}) ->
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

    { projectRoot } = options

    ## TODO: potentially just pass an event emitter
    ## instance here instead of callback functions
    menu.set({
      withDevTools: isDev()
      onLogOutClicked: ->
        bus.emit("menu:item:clicked", "log:out")
    })

    savedState(projectRoot, false)
    .then (state) -> state.get()
    .then (state) =>
      Windows.open(projectRoot, @getWindowArgs(state, options))
      .then (win) =>
        Events.start(_.extend({}, options, {
          onFocusTests: -> win.focus()
          os: os.platform()
        }), bus)

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
