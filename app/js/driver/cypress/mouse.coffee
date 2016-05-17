$Cypress.Mouse = do ($Cypress, _, Promise) ->

  stopPropagation = MouseEvent.prototype.stopPropagation

  ## clientX and clientY by their definition
  ## are calculated from viewport edge
  ## and should subtract the pageX or pageY offset
  ## see img: https://camo.githubusercontent.com/9963a83071b4b14c8dee6699335630f29d668d1f/68747470733a2f2f692d6d73646e2e7365632e732d6d7366742e636f6d2f64796e696d672f49433536313937302e706e67

  getClientX = (coords, win) ->
    coords.x - win.pageXOffset

  getClientY = (coords, win) ->
    coords.y - win.pageYOffset

  return {
    mouseDown: ($elToClick, coords, win) ->
      mdownEvt = new MouseEvent "mousedown", {
        bubbles: true
        cancelable: true
        view: win
        clientX: getClientX(coords, win)
        clientY: getClientY(coords, win)
        buttons: 1
        detail: 1
      }

      ## ensure this property exists on older chromium versions
      mdownEvt.buttons ?= 1

      mdownEvt.stopPropagation = ->
        @_hasStoppedPropagation = true
        stopPropagation.apply(@, arguments)

      cancelled = !$elToClick.get(0).dispatchEvent(mdownEvt)

      {
        preventedDefault: cancelled
        stoppedPropagation: !!mdownEvt._hasStoppedPropagation
      }

    mouseUp: ($elToClick, coords, win) ->
      mupEvt = new MouseEvent "mouseup", {
        bubbles: true
        cancelable: true
        view: win
        clientX: getClientX(coords, win)
        clientY: getClientY(coords, win)
        buttons: 0
        detail: 1
      }

      ## ensure this property exists on older chromium versions
      mupEvt.buttons ?= 0

      mupEvt.stopPropagation = ->
        @_hasStoppedPropagation = true
        stopPropagation.apply(@, arguments)

      cancelled = !$elToClick.get(0).dispatchEvent(mupEvt)

      {
        preventedDefault: cancelled
        stoppedPropagation: !!mupEvt._hasStoppedPropagation
      }

    click: ($elToClick, coords, win) ->
      clickEvt = new MouseEvent "click", {
        bubbles: true
        cancelable: true
        view: win
        clientX: getClientX(coords, win)
        clientY: getClientY(coords, win)
        buttons: 0
        detail: 1
      }

      ## ensure this property exists on older chromium versions
      clickEvt.buttons ?= 0

      clickEvt.stopPropagation = ->
        @_hasStoppedPropagation = true
        stopPropagation.apply(@, arguments)

      cancelled = !$elToClick.get(0).dispatchEvent(clickEvt)

      {
        preventedDefault: cancelled
        stoppedPropagation: !!clickEvt._hasStoppedPropagation
      }
  }