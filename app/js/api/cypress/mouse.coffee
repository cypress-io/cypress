$Cypress.Mouse = do ($Cypress, _, Promise) ->

  stopPropagation = MouseEvent.prototype.stopPropagation

  return {
    mouseDown: ($elToClick, coords, win) ->
      mdownEvt = new MouseEvent "mousedown", {
        bubbles: true
        cancelable: true
        view: win
        clientX: coords.x
        clientY: coords.y
        buttons: 1
        detail: 1
      }

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
        clientX: coords.x
        clientY: coords.y
        buttons: 0
        detail: 1
      }

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
        clientX: coords.x
        clientY: coords.y
        buttons: 0
        detail: 1
      }

      clickEvt.stopPropagation = ->
        @_hasStoppedPropagation = true
        stopPropagation.apply(@, arguments)

      cancelled = !$elToClick.get(0).dispatchEvent(clickEvt)

      {
        preventedDefault: cancelled
        stoppedPropagation: !!clickEvt._hasStoppedPropagation
      }
  }