$dom = require("../dom")
$window = require("../dom/window")
$elements = require("../dom/elements")
$actionability = require("./actionability")

create = (state) ->
  fireBlur = (el) ->
    win = $window.getWindowByElement(el)

    hasBlurred = false

    hasFocus = top.document.hasFocus()

    if not hasFocus
      win.focus()

    ## we need to bind to the blur event here
    ## because some browsers will not ever fire
    ## the blur event if the window itself is not
    ## currently blured
    cleanup = ->
      $elements.callNativeMethod(el, "removeEventListener", "blur", onBlur)

    onBlur = ->
      hasBlurred = true

    ## for simplicity we allow change events
    ## to be triggered by a manual blur
    $actionability.dispatchPrimedChangeEvents(state)

    $elements.callNativeMethod(el, "addEventListener", "blur", onBlur)

    $elements.callNativeMethod(el, "blur")

    cleanup()

    ## body will never emit focus events
    ## so we avoid simulating this
    if $elements.isBody(el)
      return

    ## fallback if our focus event never fires
    ## to simulate the focus + focusin
    if not hasBlurred
      ## todo handle relatedTarget's per the spec
      focusoutEvt = new FocusEvent "focusout", {
        bubbles: true
        cancelable: false
        view: win
        relatedTarget: null
      }

      blurEvt = new FocusEvent "blur", {
        bubble: false
        cancelable: false
        view: win
        relatedTarget: null
      }

      el.dispatchEvent(blurEvt)
      el.dispatchEvent(focusoutEvt)

  fireFocus = (el) ->
    ## if we are focusing a different element
    ## dispatch any primed change events
    ## we have to do this because our blur
    ## method might not get triggered if
    ## our window is in focus since the
    ## browser may fire blur events naturally
    $actionability.dispatchPrimedChangeEvents(state)

    win = $window.getWindowByElement(el)

    ## store the current focused element
    ## since when we call .focus() it will change
    $focused = getFocused()

    hasFocused = false

    hasFocus = top.document.hasFocus()

    if not hasFocus
      win.focus()

    ## we need to bind to the focus event here
    ## because some browsers will not ever fire
    ## the focus event if the window itself is not
    ## currently focused
    cleanup = ->
      $elements.callNativeMethod(el, "removeEventListener", "focus", onFocus)

    onFocus = ->
      hasFocused = true

    $elements.callNativeMethod(el, "addEventListener", "focus", onFocus)

    $elements.callNativeMethod(el, "focus")

    cleanup()

    ## body will never emit focus events
    ## so we avoid simulating this
    if $elements.isBody(el)
      return

    ## fallback if our focus event never fires
    ## to simulate the focus + focusin
    if not hasFocused
      simulate = ->
        ## todo handle relatedTarget's per the spec
        focusinEvt = new FocusEvent "focusin", {
          bubbles: true
          view: win
          relatedTarget: null
        }

        focusEvt = new FocusEvent "focus", {
          view: win
          relatedTarget: null
        }

        ## not fired in the correct order per w3c spec
        ## because chrome chooses to fire focus before focusin
        ## and since we have a simulation fallback we end up
        ## doing it how chrome does it
        ## http://www.w3.org/TR/DOM-Level-3-Events/#h-events-focusevent-event-order
        el.dispatchEvent(focusEvt)
        el.dispatchEvent(focusinEvt)

      ## only blur if we have a focused element AND its not
      ## currently ourselves!
      if $focused and $focused.get(0) isnt el
        ## additionally make sure that this isnt
        ## the window, since that does not steal focus
        ## or actually change the activeElement
        if not $window.isWindow(el)
          fireBlur($focused.get(0))

      simulate()

  interceptFocus = (el, contentWindow, focusOption) ->
    ## if our document does not have focus
    ## then that means that we need to attempt to
    ## bring our window into focus, and then figure
    ## out if the browser fires the native focus
    ## event - and if it doesn't, to flag this
    ## element as needing focus on the next action
    ## command
    hasFocus = top.document.hasFocus()

    if not hasFocus
      contentWindow.focus()

      didReceiveFocus = false

      onFocus = ->
        didReceiveFocus = true

      $elements.callNativeMethod(el, "addEventListener", "focus", onFocus)

    evt = $elements.callNativeMethod(el, "focus", focusOption)

    ## always unbind if added listener
    if onFocus
      $elements.callNativeMethod(el, "removeEventListener", "focus", onFocus)

      ## if we didn't receive focus
      if not didReceiveFocus
        ## then store this element as needing
        ## force'd focus later on
        state("needsForceFocus", el)

    return evt

  needsForceFocus = ->
    ## if we have a primed focus event then
    if needsForceFocus = state("needsForceFocus")
      ## always reset it
      state("needsForceFocus", null)

    ## and return whatever needs force focus
    return needsForceFocus

  needsFocus = ($elToFocus, $previouslyFocusedEl) ->
    $focused = getFocused()

    ## if we dont have a focused element
    ## we know we want to fire a focus event
    return true if not $focused

    ## if we didnt have a previously focused el
    ## then always return true
    return true if not $previouslyFocusedEl

    ## if we are attemping to focus a differnet element
    ## than the one we currently have, we know we want
    ## to fire a focus event
    return true if $focused.get(0) isnt $elToFocus.get(0)

    ## if our focused element isnt the same as the previously
    ## focused el then what probably happened is our mouse
    ## down event caused our element to receive focuse
    ## without the browser sending the focus event
    ## which happens when the window isnt in focus
    return true if $previouslyFocusedEl.get(0) isnt $focused.get(0)

    return false

  getFocused = ->
    try
      { activeElement, body } = state("document")

      ## active element is the default if its null
      ## or its equal to document.body
      activeElementIsDefault = ->
        (not activeElement) or (activeElement is body)

      if activeElementIsDefault()
        return null

      return $dom.wrap(activeElement)
    catch
      return null

  return {
    fireBlur

    fireFocus

    needsFocus

    getFocused

    interceptFocus

    needsForceFocus
  }

module.exports = {
  create
}
