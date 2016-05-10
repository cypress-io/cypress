_            = require("lodash")
cypressIcons = require("@cypress/core-icons")
nativeImage  = require("electron").nativeImage
systemPrefs  = require("electron").systemPreferences
ElectronTray = require("electron").Tray

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

  display: (options = {})->
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

    ## subscribe to pref change events
    systemPrefs.subscribeNotification "AppleInterfaceThemeChangedNotification", => @setState()
    @tray.setPressedImage(colors.white)
    @setState()
    @tray.setToolTip("Cypress")
