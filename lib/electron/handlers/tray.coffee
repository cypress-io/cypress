_            = require("lodash")
cypressIcons = require("@cypress/core-icons")
nativeImage  = require("electron").nativeImage
Tray         = require("electron").Tray

tray = null

module.exports = {
  display: (options = {}) ->
    _.defaults options,
      onDrop: ->
      onClick: ->
      onRightClick: ->
      onDragEnter: ->
      onDragLeave: ->

    ## the primary (black) icon can be a template
    ## but the white varient (setPressedImage) CANNOT be a template
    black = nativeImage.createFromPath(cypressIcons.getPathToTray("mac-normal.png"))
    white = nativeImage.createFromPath(cypressIcons.getPathToTray("mac-normal-inverse.png"))

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

    tray.setImage(black)
    tray.setPressedImage(white)
    # tray.setPressedImage(cypressIcons.getPathToTray("mac-normal-inverse.png"))
    tray.setToolTip("Cypress")

    return tray
}