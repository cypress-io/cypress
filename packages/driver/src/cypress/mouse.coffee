Promise = require("bluebird")

$Cypress = require("../cypress")
$Keyboard = require("./keyboard")
$dom = require("../dom")

stopPropagation = window.MouseEvent.prototype.stopPropagation

module.exports = {
  mouseDown: ($elToClick, fromViewport) ->
    el = $elToClick.get(0)

    win = $dom.getWindowByElement(el)

    mdownEvtProps = $Keyboard.mixinModifiers({
      bubbles: true
      cancelable: true
      view: win
      clientX: fromViewport.x
      clientY: fromViewport.y
      buttons: 1
      detail: 1
    })

    mdownEvt = new win.MouseEvent "mousedown", mdownEvtProps

    ## ensure this property exists on older chromium versions
    mdownEvt.buttons ?= 1

    mdownEvt.stopPropagation = ->
      @_hasStoppedPropagation = true
      stopPropagation.apply(@, arguments)

    cancelled = !el.dispatchEvent(mdownEvt)

    props = {
      preventedDefault: cancelled
      stoppedPropagation: !!mdownEvt._hasStoppedPropagation
    }

    modifiers = $Keyboard.activeModifiers()
    props.modifiers = modifiers.join(", ") if modifiers.length
    props

  mouseUp: ($elToClick, fromViewport) ->
    el = $elToClick.get(0)

    win = $dom.getWindowByElement(el)

    mupEvtProps = $Keyboard.mixinModifiers({
      bubbles: true
      cancelable: true
      view: win
      clientX: fromViewport.x
      clientY: fromViewport.y
      buttons: 0
      detail: 1
    })

    mupEvt = new win.MouseEvent "mouseup", mupEvtProps

    ## ensure this property exists on older chromium versions
    mupEvt.buttons ?= 0

    mupEvt.stopPropagation = ->
      @_hasStoppedPropagation = true
      stopPropagation.apply(@, arguments)

    cancelled = !el.dispatchEvent(mupEvt)

    props = {
      preventedDefault: cancelled
      stoppedPropagation: !!mupEvt._hasStoppedPropagation
    }

    modifiers = $Keyboard.activeModifiers()
    props.modifiers = modifiers.join(", ") if modifiers.length
    props

  click: ($elToClick, fromViewport) ->
    el = $elToClick.get(0)

    win = $dom.getWindowByElement(el)

    clickEvtProps = $Keyboard.mixinModifiers({
      bubbles: true
      cancelable: true
      view: win
      clientX: fromViewport.x
      clientY: fromViewport.y
      buttons: 0
      detail: 1
    })

    clickEvt = new win.MouseEvent "click", clickEvtProps

    ## ensure this property exists on older chromium versions
    clickEvt.buttons ?= 0

    clickEvt.stopPropagation = ->
      @_hasStoppedPropagation = true
      stopPropagation.apply(@, arguments)

    cancelled = !el.dispatchEvent(clickEvt)

    props = {
      preventedDefault: cancelled
      stoppedPropagation: !!clickEvt._hasStoppedPropagation
    }

    modifiers = $Keyboard.activeModifiers()
    props.modifiers = modifiers.join(", ") if modifiers.length
    props
}
