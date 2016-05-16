_            = require("lodash")
cypressIcons = require("@cypress/core-icons")
nativeImage  = require("electron").nativeImage
systemPrefs  = require("electron").systemPreferences
ElectronTray = require("electron").Tray
os           = require("os")

## the primary (black) icon can be a template
## but the white varient (setPressedImage) CANNOT be a template
colors = {
  black: nativeImage.createFromPath(cypressIcons.getPathToTray("mac-normal.png"))
  blue:  nativeImage.createFromPath(cypressIcons.getPathToTray("mac-normal-blue.png"))
  red:   nativeImage.createFromPath(cypressIcons.getPathToTray("mac-normal-red.png"))
  white: nativeImage.createFromPath(cypressIcons.getPathToTray("mac-normal-inverse.png"))
}

states = {
  default: -> if systemPrefs.isDarkMode() then colors.white else colors.black
  running: -> colors.blue
  error: -> colors.red
}

module.exports = class Tray
  constructor: ->
    @currentState = 'default'
    @tray = new ElectronTray(null)

  getColors: -> colors

  getTray: -> @tray

  setState: (state = @currentState) ->
    return if not @displayed

    if not getColor = states[state]
      throw new Error("Did not receive a valid tray icon state. Got: '#{state}'")

    @currentState = state
    @tray.setImage(getColor())

  display: (options = {}) ->
    ## dont use a tray icon in linux
    ## because this didn't use to work
    ## and we need to update the code
    ## like adding a context menu to
    ## better support it
    ## TODO: look at how other electron
    ## apps support linux tray icons
    return if os.platform() is "linux"

    @displayed = true

    _.defaults options,
      onDrop: ->
      onClick: ->
      onRightClick: ->
      onDragEnter: ->
      onDragLeave: ->

    @tray.on "click",        options.onClick
    @tray.on "right-click",  options.onRightClick
    @tray.on "drop",         options.onDrop
    @tray.on "drag-enter",   options.onDragEnter
    @tray.on "drag-leave",   options.onDragLeave
    ## normalize the double click event
    ## to do the same thing as regular
    ## click event
    @tray.on "double-click", options.onClick

    @tray.setPressedImage(colors.white)
    @tray.setToolTip("Cypress")
    @setState()

    ## subscribe to pref change events (OSX only)
    if os.platform() is "darwin"
      systemPrefs.subscribeNotification "AppleInterfaceThemeChangedNotification", => @setState()
