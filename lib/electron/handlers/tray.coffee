_            = require("lodash")
cypressIcons = require("@cypress/core-icons")
nativeImage  = require("electron").nativeImage
Tray         = require("electron").Tray

tray = null

## the primary (black) icon can be a template
## but the white varient (setPressedImage) CANNOT be a template
colors = {
  black: nativeImage.createFromPath(cypressIcons.getPathToTray("mac-normal.png"))
  blue:  nativeImage.createFromPath(cypressIcons.getPathToTray("mac-normal-blue.png"))
  red:   nativeImage.createFromPath(cypressIcons.getPathToTray("mac-normal-red.png"))
  white: nativeImage.createFromPath(cypressIcons.getPathToTray("mac-normal-inverse.png"))
}

module.exports = {
  setImage: (color, options = {}) ->
    return if not tray

    if not c = colors[color]
      throw new Error("Did not receive a valid tray icon color. Got: '#{color}'")

    if options.pressed
      tray.setPressedImage(c)
    else
      tray.setImage(c)

  getColors: -> colors

  getTray: -> tray

  resetTray: -> tray = null

  ## TODO: restructure this
  ## to return the tray instance
  ## so it can then be passed around
  ## to methods like 'display' or
  ## setImage instead of acting like
  ## a singleton
  display: (options = {}) ->
    _.defaults options,
      onDrop: ->
      onClick: ->
      onRightClick: ->
      onDragEnter: ->
      onDragLeave: ->

    tray = new Tray(null)

    tray.on "click",        options.onClick
    tray.on "right-click",  options.onRightClick
    tray.on "drop",         options.onDrop
    tray.on "drag-enter",   options.onDragEnter
    tray.on "drag-leave",   options.onDragLeave

    ## normalize the double click event
    ## to do the same thing as regular
    ## click event
    tray.on "double-click", options.onClick

    @setImage("black")
    @setImage("white", {pressed: true})
    tray.setToolTip("Cypress")

    return tray
}