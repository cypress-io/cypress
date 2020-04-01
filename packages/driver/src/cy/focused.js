$dom = require("../dom")
$window = require("../dom/window")
$elements = require("../dom/elements")
$actionability = require("./actionability")

create = (state) ->

  documentHasFocus = () ->
    ## hardcode document has focus as true
    ## since the test should assume the window
    ## is in focus the entire time
    return true

  fireBlur = (el) ->
    win = $window.getWindowByElement(el)

    hasBlurred = false

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
      simulateBlurEvent(el, win)

  simulateBlurEvent = (el, win) ->
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
    ## body will never emit focus events (unless it's contenteditable)
    ## so we avoid simulating this
    if $elements.isBody(el) && !$elements.isContentEditable(el)
      return

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

    ## fallback if our focus event never fires
    ## to simulate the focus + focusin
    if not hasFocused

      ## only blur if we have a focused element AND its not
      ## currently ourselves!
      if $focused and $focused.get(0) isnt el
        ## additionally make sure that this isnt
        ## the window, since that does not steal focus
        ## or actually change the activeElement
        if not $window.isWindow(el)
          fireBlur($focused.get(0))

      simulateFocusEvent(el, win)

  simulateFocusEvent = (el, win) ->
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

  interceptFocus = (el, contentWindow, focusOption) ->
    ## normally programmatic focus calls cause "primed" focus/blur
    ## events if the window is not in focus
    ## so we fire fake events to act as if the window
    ## is always in focus
    $focused = getFocused()

    if (!$focused || $focused[0] isnt el) && $elements.isW3CFocusable(el)
      fireFocus(el)
      return

    $elements.callNativeMethod(el, 'focus')
    return

  interceptBlur = (el) ->
    ## normally programmatic blur calls cause "primed" focus/blur
    ## events if the window is not in focus
    ## so we fire fake events to act as if the window
    ## is always in focus.
    $focused = getFocused()

    if $focused && $focused[0] is el
      fireBlur(el)
      return

    $elements.callNativeMethod(el, 'blur')
    return

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
    { activeElement } = state("document")

    if $dom.isFocused(activeElement)
      return $dom.wrap(activeElement)

    return null

  return {
    fireBlur

    fireFocus

    needsFocus

    getFocused

    interceptFocus

    interceptBlur,

    documentHasFocus,
  }

module.exports = {
  create
}
