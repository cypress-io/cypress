import $dom from '../dom'
import $window from '../dom/window'
import $elements from '../dom/elements'
import $actionability from './actionability'
import type { StateFunc } from '../cypress/state'

const simulateBlurEvent = (el, win) => {
  // todo handle relatedTarget's per the spec
  const focusoutEvt = new FocusEvent('focusout', {
    bubbles: true,
    cancelable: false,
    view: win,
    relatedTarget: null,
  })

  const blurEvt = new FocusEvent('blur', {
    // @ts-ignore // Bubble isn't available on FocusEvent?
    bubble: false,
    cancelable: false,
    view: win,
    relatedTarget: null,
  })

  el.dispatchEvent(blurEvt)

  return el.dispatchEvent(focusoutEvt)
}

const simulateFocusEvent = (el, win) => {
  // todo handle relatedTarget's per the spec
  const focusinEvt = new FocusEvent('focusin', {
    bubbles: true,
    view: win,
    relatedTarget: null,
  })

  const focusEvt = new FocusEvent('focus', {
    view: win,
    relatedTarget: null,
  })

  // not fired in the correct order per w3c spec
  // because chrome chooses to fire focus before focusin
  // and since we have a simulation fallback we end up
  // doing it how chrome does it
  // http://www.w3.org/TR/DOM-Level-3-Events/#h-events-focusevent-event-order
  el.dispatchEvent(focusEvt)

  return el.dispatchEvent(focusinEvt)
}

// eslint-disable-next-line @cypress/dev/arrow-body-multiline-braces
export const create = (state: StateFunc) => ({
  documentHasFocus () {
    // hardcode document has focus as true
    // since the test should assume the window
    // is in focus the entire time
    return true
  },

  fireBlur (el) {
    const win = $window.getWindowByElement(el)

    let hasBlurred = false

    // we need to bind to the blur event here
    // because some browsers will not ever fire
    // the blur event if the window itself is not
    // currently blured
    const cleanup = () => {
      return $elements.callNativeMethod(el, 'removeEventListener', 'blur', onBlur)
    }

    const onBlur = () => {
      return hasBlurred = true
    }

    // for simplicity we allow change events
    // to be triggered by a manual blur
    $actionability.dispatchPrimedChangeEvents(state)

    $elements.callNativeMethod(el, 'addEventListener', 'blur', onBlur)

    $elements.callNativeMethod(el, 'blur')

    cleanup()

    // body will never emit focus events
    // so we avoid simulating this
    if ($elements.isBody(el)) {
      return
    }

    // fallback if our focus event never fires
    // to simulate the focus + focusin
    if (!hasBlurred) {
      return simulateBlurEvent(el, win)
    }
  },

  fireFocus (el, opts) {
    // body will never emit focus events (unless it's contenteditable)
    // so we avoid simulating this
    if ($elements.isBody(el) && !$elements.isContentEditable(el)) {
      return
    }

    // if we are focusing a different element
    // dispatch any primed change events
    // we have to do this because our blur
    // method might not get triggered if
    // our window is in focus since the
    // browser may fire blur events naturally
    $actionability.dispatchPrimedChangeEvents(state)

    const win = $window.getWindowByElement(el)

    // store the current focused element, since it will change when we call .focus()
    //
    // need to pass in el.ownerDocument to get the correct focused element
    // when el is in an iframe and the browser is not
    // in focus (https://github.com/cypress-io/cypress/issues/8111)
    const $focused = this.getFocused(el.ownerDocument)

    let hasFocused = false

    // we need to bind to the focus event here
    // because some browsers will not ever fire
    // the focus event if the window itself is not
    // currently focused
    const cleanup = () => {
      return $elements.callNativeMethod(el, 'removeEventListener', 'focus', onFocus)
    }

    const onFocus = () => {
      return hasFocused = true
    }

    $elements.callNativeMethod(el, 'addEventListener', 'focus', onFocus)

    $elements.callNativeMethod(el, 'focus', opts)

    cleanup()

    // fallback if our focus event never fires
    // to simulate the focus + focusin
    if (!hasFocused) {
      // only blur if we have a focused element AND its not
      // currently ourselves!
      if ($focused && $focused.get(0) !== el) {
        // additionally make sure that this isnt
        // the window, since that does not steal focus
        // or actually change the activeElement
        if (!$window.isWindow(el)) {
          this.fireBlur($focused.get(0))
        }
      }

      return simulateFocusEvent(el, win)
    }
  },

  interceptFocus (el, win, opts) {
    // normally programmatic focus calls cause "primed" focus/blur
    // events if the window is not in focus
    // so we fire fake events to act as if the window
    // is always in focus
    const $focused = this.getFocused()

    if ((!$focused || $focused[0] !== el) && $dom.isW3CFocusable(el)) {
      this.fireFocus(el, opts)

      return
    }

    $elements.callNativeMethod(el, 'focus', opts)
  },

  interceptBlur (el) {
    // normally programmatic blur calls cause "primed" focus/blur
    // events if the window is not in focus
    // so we fire fake events to act as if the window
    // is always in focus.
    const $focused = this.getFocused()

    if ($focused && $focused[0] === el) {
      this.fireBlur(el)

      return
    }

    $elements.callNativeMethod(el, 'blur')
  },

  needsFocus ($elToFocus, $previouslyFocusedEl) {
    const $focused = this.getFocused()

    // if we dont have a focused element
    // we know we want to fire a focus event
    if (!$focused) {
      return true
    }

    // if we didnt have a previously focused el
    // then always return true
    if (!$previouslyFocusedEl) {
      return true
    }

    // if we are attemping to focus a differnet element
    // than the one we currently have, we know we want
    // to fire a focus event
    if ($focused.get(0) !== $elToFocus.get(0)) {
      return true
    }

    // if our focused element isnt the same as the previously
    // focused el then what probably happened is our mouse
    // down event caused our element to receive focuse
    // without the browser sending the focus event
    // which happens when the window isnt in focus
    if ($previouslyFocusedEl.get(0) !== $focused.get(0)) {
      return true
    }

    return false
  },

  getFocused (document = state('document')) {
    const { activeElement } = document

    if ($dom.isFocused(activeElement)) {
      return $dom.wrap(activeElement)
    }

    return null
  },
})

export interface IFocused extends ReturnType<typeof create> {}
