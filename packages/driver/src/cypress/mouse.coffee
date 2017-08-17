Promise = require("bluebird")

$Cypress = require("../cypress")
$Keyboard = require("./keyboard")
utils = require("./utils")

stopPropagation = window.MouseEvent.prototype.stopPropagation

module.exports = {
  mouseDown: ($elToClick, coords, win) ->
    mdownEvtProps = $Keyboard.mixinModifiers({
      bubbles: true
      cancelable: true
      view: win
      clientX: utils.getClientX(coords, win)
      clientY: utils.getClientY(coords, win)
      buttons: 1
      detail: 1
    })

    mdownEvt = new window.MouseEvent "mousedown", mdownEvtProps

    ## ensure this property exists on older chromium versions
    mdownEvt.buttons ?= 1

    mdownEvt.stopPropagation = ->
      @_hasStoppedPropagation = true
      stopPropagation.apply(@, arguments)

    cancelled = !$elToClick.get(0).dispatchEvent(mdownEvt)

    props = {
      preventedDefault: cancelled
      stoppedPropagation: !!mdownEvt._hasStoppedPropagation
    }

    modifiers = $Keyboard.activeModifiers()
    props.modifiers = modifiers.join(", ") if modifiers.length
    props

  mouseUp: ($elToClick, coords, win) ->
    mupEvtProps = $Keyboard.mixinModifiers({
      bubbles: true
      cancelable: true
      view: win
      clientX: utils.getClientX(coords, win)
      clientY: utils.getClientY(coords, win)
      buttons: 0
      detail: 1
    })

    mupEvt = new MouseEvent "mouseup", mupEvtProps

    ## ensure this property exists on older chromium versions
    mupEvt.buttons ?= 0

    mupEvt.stopPropagation = ->
      @_hasStoppedPropagation = true
      stopPropagation.apply(@, arguments)

    cancelled = !$elToClick.get(0).dispatchEvent(mupEvt)

    props = {
      preventedDefault: cancelled
      stoppedPropagation: !!mupEvt._hasStoppedPropagation
    }

    modifiers = $Keyboard.activeModifiers()
    props.modifiers = modifiers.join(", ") if modifiers.length
    props

  click: ($elToClick, coords, win) ->
    clickEvtProps = $Keyboard.mixinModifiers({
      bubbles: true
      cancelable: true
      view: win
      clientX: utils.getClientX(coords, win)
      clientY: utils.getClientY(coords, win)
      buttons: 0
      detail: 1
    })

    clickEvt = new MouseEvent "click", clickEvtProps

    ## ensure this property exists on older chromium versions
    clickEvt.buttons ?= 0

    clickEvt.stopPropagation = ->
      @_hasStoppedPropagation = true
      stopPropagation.apply(@, arguments)

    cancelled = !$elToClick.get(0).dispatchEvent(clickEvt)

    props = {
      preventedDefault: cancelled
      stoppedPropagation: !!clickEvt._hasStoppedPropagation
    }

    modifiers = $Keyboard.activeModifiers()
    props.modifiers = modifiers.join(", ") if modifiers.length
    props
}
