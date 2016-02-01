_            = require("lodash")
cypressIcons = require("cypress-icons")
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
    black = nativeImage.createFromPath(cypressIcons.getPathToTray("mac-normalTemplate.png"))
    white = nativeImage.createFromPath(cypressIcons.getPathToTray("mac-normal-inverse.png"))
    # white = nativeImage.createFromPath(cypressIcons.getPathToTray("menubar-icon-alt.png"))
    # white = nativeImage.createFromPath(cypressIcons.getPathToTray("mac-normal-inverseTemplate@2x.png"))
    # white = nativeImage.createFromPath(cypressIcons.getPathToTray("mac-normal-inverseTemplate.png"))

    # black.setTemplateImage(true)
    # white.setTemplateImage(true)

    # console.log black.isTemplateImage()
    # console.log white.isTemplateImage()

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
    # icon.setToolTip("Cypress.io")

    return tray
}