import $ from 'jquery'
import _ from 'lodash'
import $dom from '../dom'
import $elements from '../dom/elements'
import $Keyboard, { Keyboard, ModifiersEventOptions } from './keyboard'
import $selection from '../dom/selection'
import debugFn from 'debug'
import type { StateFunc } from '../cypress/state'
import type { IFocused } from './focused'
import type { ICypress } from '../cypress'
import type { ElViewportPostion } from '../dom/coordinates'

const debug = debugFn('cypress:driver:mouse')

export type ForceEl = false | HTMLElement

export type MouseCoords = { x?: number, y?: number}

/**
 * @typedef Coords
 * @property {number} x
 * @property {number} y
 * @property {Document} doc
 */

const getLastHoveredEl = (state: StateFunc): HTMLElement | null => {
  let lastHoveredEl = state('mouseLastHoveredEl')
  const lastHoveredElAttached = lastHoveredEl && $elements.isAttachedEl(lastHoveredEl)

  if (!lastHoveredElAttached) {
    lastHoveredEl = null
    state('mouseLastHoveredEl', lastHoveredEl)
  }

  return lastHoveredEl
}

const defaultPointerDownUpOptions = {
  pointerType: 'mouse',
  pointerId: 1,
  isPrimary: true,
  detail: 0,
  // pressure 0.5 is default for mouse that doesn't support pressure
  // https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent/pressure
  pressure: 0.5,
}

const getMouseCoords = (state: StateFunc) => {
  return state('mouseCoords')
}

type DefaultMouseOptions = ModifiersEventOptions & CoordsEventOptions & {
  view: Window
  composed: boolean
  relatedTarget: HTMLElement | null
}

export const create = (state: StateFunc, keyboard: Keyboard, focused: IFocused, Cypress: ICypress) => {
  const isFirefox = Cypress.browser.family === 'firefox'
  const isWebKit = Cypress.isBrowser('webkit')
  // Chromium 116+ allows the simulated events to be sent to disabled elements so we need to explicitly exclude them
  const isChromium116OrLater = Cypress.isBrowser({ family: 'chromium' }) && Cypress.browserMajorVersion() >= 116

  const sendPointerEvent = (el, evtOptions, evtName, bubbles = false, cancelable = false) => {
    const constructor = el.ownerDocument.defaultView.PointerEvent

    return sendEvent(evtName, el, evtOptions, bubbles, cancelable, constructor, true)
  }
  const sendMouseEvent = (el, evtOptions, evtName, bubbles = false, cancelable = false) => {
    // IE doesn't have event constructors, so you should use document.createEvent('mouseevent')
    // https://dom.spec.whatwg.org/#dom-document-createevent
    const constructor = el.ownerDocument.defaultView.MouseEvent

    return sendEvent(evtName, el, evtOptions, bubbles, cancelable, constructor, true)
  }

  const sendPointerup = (el, evtOptions) => {
    if ((isFirefox || isWebKit) && el.disabled) {
      return {}
    }

    return sendPointerEvent(el, evtOptions, 'pointerup', true, true)
  }
  const sendPointerdown = (el, evtOptions): {} | SentEvent => {
    if ((isFirefox || isWebKit) && el.disabled) {
      return {}
    }

    return sendPointerEvent(el, evtOptions, 'pointerdown', true, true)
  }
  const sendPointermove = (el, evtOptions) => {
    return sendPointerEvent(el, evtOptions, 'pointermove', true, true)
  }
  const sendPointerover = (el, evtOptions: DefaultMouseOptions) => {
    return sendPointerEvent(el, evtOptions, 'pointerover', true, true)
  }
  const sendPointerenter = (el, evtOptions) => {
    return sendPointerEvent(el, evtOptions, 'pointerenter', false, false)
  }
  const sendPointerleave = (el, evtOptions) => {
    return sendPointerEvent(el, evtOptions, 'pointerleave', false, false)
  }
  const sendPointerout = (el, evtOptions) => {
    return sendPointerEvent(el, evtOptions, 'pointerout', true, true)
  }

  const sendMouseup = (el, evtOptions) => {
    if ((isFirefox || isWebKit || isChromium116OrLater) && el.disabled) {
      return {}
    }

    return sendMouseEvent(el, evtOptions, 'mouseup', true, true)
  }
  const sendMousedown = (el, evtOptions): {} | SentEvent => {
    if ((isFirefox || isWebKit || isChromium116OrLater) && el.disabled) {
      return {}
    }

    return sendMouseEvent(el, evtOptions, 'mousedown', true, true)
  }
  const sendMousemove = (el, evtOptions) => {
    return sendMouseEvent(el, evtOptions, 'mousemove', true, true)
  }
  const sendMouseover = (el, evtOptions: DefaultMouseOptions) => {
    return sendMouseEvent(el, evtOptions, 'mouseover', true, true)
  }
  const sendMouseenter = (el, evtOptions) => {
    return sendMouseEvent(el, evtOptions, 'mouseenter', false, false)
  }
  const sendMouseleave = (el, evtOptions) => {
    return sendMouseEvent(el, evtOptions, 'mouseleave', false, false)
  }
  const sendMouseout = (el, evtOptions) => {
    return sendMouseEvent(el, evtOptions, 'mouseout', true, true)
  }
  const sendClick = (el, evtOptions, opts: { force?: boolean } = {}) => {
    // send the click event if firefox and force (needed for force check checkbox)
    if (!opts.force && (isFirefox || isWebKit || isChromium116OrLater) && el.disabled) {
      return {}
    }

    return sendMouseEvent(el, evtOptions, 'click', true, true)
  }
  const sendDblclick = (el, evtOptions) => {
    if ((isFirefox || isWebKit || isChromium116OrLater) && el.disabled) {
      return {}
    }

    return sendMouseEvent(el, evtOptions, 'dblclick', true, true)
  }
  const sendContextmenu = (el, evtOptions) => {
    if ((isFirefox || isWebKit || isChromium116OrLater) && el.disabled) {
      return {}
    }

    return sendMouseEvent(el, evtOptions, 'contextmenu', true, true)
  }
  const shouldFireMouseMoveEvents = (targetEl, lastHoveredEl, fromElViewport, coords) => {
  // not the same element, fire mouse move events
    if (lastHoveredEl !== targetEl) {
      return true
    }

    const xy = (obj) => {
      return _.pick(obj, 'x', 'y')
    }

    // if we have the same element, but the xy coords are different
    // then fire mouse move events...
    return !_.isEqual(xy(fromElViewport), xy(coords))
  }

  const shouldMoveCursorToEndAfterMousedown = (el: HTMLElement) => {
    const _debug = debug.extend(':shouldMoveCursorToEnd')

    _debug('shouldMoveToEnd?', el)
    if (!$elements.isElement(el)) {
      _debug('false: not element')

      return false
    }

    if (!($elements.isInput(el) || $elements.isTextarea(el) || $elements.isContentEditable(el))) {
      _debug('false: not input/textarea/contentedtable')

      return false
    }

    if ($elements.isNeedSingleValueChangeInputElement(el)) {
      _debug('false: is single value change input')

      return false
    }

    _debug('true: should move to end')

    return true
  }

  const mouse = {
    _getDefaultMouseOptions (x, y, win): DefaultMouseOptions {
      const _activeModifiers = keyboard.getActiveModifiers()
      const modifiersEventOptions = $Keyboard.toModifiersEventOptions(_activeModifiers)
      const coordsEventOptions = toCoordsEventOptions(x, y, win)

      return _.extend({
        view: win,
        // allow propagation out of root of shadow-dom
        // https://developer.mozilla.org/en-US/docs/Web/API/Event/composed
        composed: true,
        // only for events involving moving cursor
        relatedTarget: null,
      }, modifiersEventOptions, coordsEventOptions)
    },

    move (fromElViewport: ElViewportPostion, forceEl?: ForceEl) {
      debug('mouse.move', fromElViewport)

      const lastHoveredEl = getLastHoveredEl(state)

      const targetEl = forceEl || mouse.getElAtCoords(fromElViewport)

      // if the element is already hovered and our coords for firing the events
      // already match our existing state coords, then bail early and don't fire
      // any mouse move events
      if (!shouldFireMouseMoveEvents(targetEl, lastHoveredEl, fromElViewport, getMouseCoords(state))) {
        return { el: targetEl }
      }

      const events = mouse._moveEvents(targetEl, fromElViewport)

      const resultEl = forceEl || mouse.getElAtCoords(fromElViewport)

      return { el: resultEl, fromEl: lastHoveredEl, events }
    },

    /**
     * @param {HTMLElement} el
     * @param {Coords} coords
     * Steps to perform mouse move:
     * - send out events to elLastHovered (bubbles)
     * - send leave events to all Elements until commonAncestor
     * - send over events to elToHover (bubbles)
     * - send enter events to all elements from commonAncestor
     * - send move events to elToHover (bubbles)
     * - elLastHovered = elToHover
     */
    _moveEvents (el: HTMLElement, coords: ElViewportPostion) {
      // events are not fired on disabled elements, so we don't have to take that into account
      const win = $dom.getWindowByElement(el)
      const { x, y } = coords

      const defaultOptions = mouse._getDefaultMouseOptions(x, y, win)
      const defaultMouseOptions = _.extend({}, defaultOptions, {
        button: 0,
        which: 0,
        buttons: 0,
      })

      const defaultPointerOptions = _.extend({}, defaultOptions, {
        button: -1,
        which: 0,
        buttons: 0,
        pointerId: 1,
        pointerType: 'mouse',
        isPrimary: true,
      })

      const notFired = () => {
        return {
          skipped: formatReasonNotFired('Already on Coordinates'),
        }
      }

      type EventFunc =
        | (() => { skipped: string })
        | (() => SentEvent)

      let pointerout = _.noop
      let pointerleave = _.noop
      let pointerover: EventFunc = notFired
      let pointerenter = _.noop
      let mouseout = _.noop
      let mouseleave = _.noop
      let mouseover: EventFunc = notFired
      let mouseenter = _.noop
      let pointermove: EventFunc = notFired
      let mousemove: EventFunc = notFired

      const lastHoveredEl = getLastHoveredEl(state)

      const hoveredElChanged = el !== lastHoveredEl
      let commonAncestor = null

      if (hoveredElChanged && lastHoveredEl) {
        commonAncestor = $elements.getFirstCommonAncestor(el, lastHoveredEl)
        pointerout = () => {
          sendPointerout(lastHoveredEl, _.extend({}, defaultPointerOptions, { relatedTarget: el }))
        }

        mouseout = () => {
          sendMouseout(lastHoveredEl, _.extend({}, defaultMouseOptions, { relatedTarget: el }))
        }

        let curParent: Node | null = lastHoveredEl

        const elsToSendMouseleave: Node[] = []

        while (curParent && curParent.ownerDocument && curParent !== commonAncestor) {
          elsToSendMouseleave.push(curParent)
          curParent = curParent.parentNode
        }

        pointerleave = () => {
          elsToSendMouseleave.forEach((elToSend) => {
            sendPointerleave(elToSend, _.extend({}, defaultPointerOptions, { relatedTarget: el }))
          })
        }

        mouseleave = () => {
          elsToSendMouseleave.forEach((elToSend) => {
            sendMouseleave(elToSend, _.extend({}, defaultMouseOptions, { relatedTarget: el }))
          })
        }
      }

      if (hoveredElChanged) {
        if (el && $elements.isAttachedEl(el)) {
          mouseover = () => {
            return sendMouseover(el, _.extend({}, defaultMouseOptions, { relatedTarget: lastHoveredEl }))
          }

          pointerover = () => {
            return sendPointerover(el, _.extend({}, defaultPointerOptions, { relatedTarget: lastHoveredEl }))
          }

          let curParent: Node | null = el
          const elsToSendMouseenter: Node[] = []

          while (curParent && curParent.ownerDocument && curParent !== commonAncestor) {
            elsToSendMouseenter.push(curParent)
            curParent = curParent.parentNode
          }

          elsToSendMouseenter.reverse()

          pointerenter = () => {
            return elsToSendMouseenter.forEach((elToSend) => {
              sendPointerenter(elToSend, _.extend({}, defaultPointerOptions, { relatedTarget: lastHoveredEl }))
            })
          }

          mouseenter = () => {
            return elsToSendMouseenter.forEach((elToSend) => {
              sendMouseenter(elToSend, _.extend({}, defaultMouseOptions, { relatedTarget: lastHoveredEl }))
            })
          }
        }
      }

      pointermove = () => {
        return sendPointermove(el, defaultPointerOptions)
      }

      mousemove = () => {
        return sendMousemove(el, defaultMouseOptions)
      }

      // TODO: make `type` below more specific.
      const events: Array<ReturnType<EventFunc> & { type: string }> = []

      pointerout()
      pointerleave()
      events.push({ type: 'pointerover', ...pointerover() })
      pointerenter()
      mouseout()
      mouseleave()
      events.push({ type: 'mouseover', ...mouseover() })
      mouseenter()
      state('mouseLastHoveredEl', $elements.isAttachedEl(el) ? el : null)
      state('mouseCoords', { x, y })
      events.push({ type: 'pointermove', ...pointermove() })
      events.push({ type: 'mousemove', ...mousemove() })

      return events
    },

    /**
     *
     * @param {Coords} coords
     * @returns {HTMLElement}
     */
    getElAtCoords ({ x, y, doc }: ElViewportPostion) {
      const el = $dom.elementFromPoint(doc, x, y)

      return el
    },

    /**
     *
     * @param {Coords} coords
     */
    moveToCoords (coords) {
      const { el } = mouse.move(coords)

      return el
    },

    /**
     * @param {Coords} coords
     * @param {HTMLElement} forceEl
     */
    _downEvents (coords, forceEl, pointerEvtOptionsExtend = {}, mouseEvtOptionsExtend = {}) {
      const { x, y } = coords
      const el = forceEl || mouse.moveToCoords(coords)

      const win = $dom.getWindowByElement(el)

      const defaultOptions = mouse._getDefaultMouseOptions(x, y, win)

      const pointerEvtOptions = _.extend({}, defaultOptions, {
        ...defaultPointerDownUpOptions,
        button: 0,
        which: 1,
        buttons: 1,
        relatedTarget: null,
      }, pointerEvtOptionsExtend)

      const mouseEvtOptions = _.extend({}, defaultOptions, {
        button: 0,
        which: 1,
        buttons: 1,
        detail: 1,
      }, mouseEvtOptionsExtend)

      // TODO: pointer events should have fractional coordinates, not rounded
      let pointerdown = sendPointerdown(
        el,
        pointerEvtOptions,
      ) as Partial<SentEvent>

      const pointerdownPrevented = pointerdown.preventedDefault
      const elIsDetached = $elements.isDetachedEl(el)

      if (pointerdownPrevented || elIsDetached) {
        let reason = 'pointerdown was cancelled'

        if (elIsDetached) {
          reason = 'Element was detached'
        }

        return {
          targetEl: el,
          events: {
            pointerdown,
            mousedown: {
              skipped: formatReasonNotFired(reason),
            },
          },
        }
      }

      let mousedown = sendMousedown(el, mouseEvtOptions)

      return {
        targetEl: el,
        events: {
          pointerdown,
          mousedown,
        },
      }
    },

    down (fromElViewport, forceEl, pointerEvtOptionsExtend = {}, mouseEvtOptionsExtend = {}) {
      const $previouslyFocused = focused.getFocused()

      const mouseDownPhase = mouse._downEvents(fromElViewport, forceEl, pointerEvtOptionsExtend, mouseEvtOptionsExtend)

      // el we just send pointerdown
      const el = mouseDownPhase.targetEl

      if (mouseDownPhase.events.pointerdown.preventedDefault || (mouseDownPhase.events.mousedown as Partial<SentEvent>).preventedDefault || !$elements.isAttachedEl(el)) {
        return mouseDownPhase
      }

      //# retrieve the first focusable $el in our parent chain
      const $elToFocus = $elements.getFirstFocusableEl($(el))

      debug('elToFocus:', $elToFocus[0])
      if (focused.needsFocus($elToFocus, $previouslyFocused)) {
        debug('el needs focus')
        if ($dom.isWindow($elToFocus)) {
          // if the first focusable element from the click
          // is the window, then we can skip the focus event
          // since the user has clicked a non-focusable element
          const $focused = focused.getFocused()

          if ($focused) {
            focused.fireBlur($focused.get(0))
          }
        } else {
          // the user clicked inside a focusable element
          focused.fireFocus($elToFocus.get(0), { preventScroll: true })
        }
      }

      if (shouldMoveCursorToEndAfterMousedown(el)) {
        debug('moveSelectionToEnd due to click', el)
        // It's a curried function, so the 2 arguments are valid.
        // @ts-ignore
        $selection.moveSelectionToEnd(el, { onlyIfEmptySelection: true })
      }

      return mouseDownPhase
    },

    /**
     * @param {HTMLElement} el
     * @param {Window} win
     * @param {Coords} fromElViewport
     * @param {HTMLElement} forceEl
     */
    up (fromElViewport, forceEl, skipMouseEvent, pointerEvtOptionsExtend = {}, mouseEvtOptionsExtend = {}) {
      debug('mouse.up', { fromElViewport, forceEl, skipMouseEvent })

      return mouse._upEvents(fromElViewport, forceEl, skipMouseEvent, pointerEvtOptionsExtend, mouseEvtOptionsExtend)
    },

    /**
    *
    * Steps to perform a click:
    *
    * moveToCoordsOrNoop = (coords) => {
    *   elAtPoint = getElementFromPoint(coords)
    *   if (elAtPoint !== elLastHovered)
    *     sendMouseMoveEvents({to: elAtPoint, from: elLastHovered})
    *     elLastHovered = elAtPoint
    *   return getElementFromPoint(coords)
    * }
    *
    * coords = getCoords(elSubject)
    * el1 = moveToCoordsOrNoop(coords)
    * sendMousedown(el1)
    * el2 = moveToCoordsOrNoop(coords)
    * sendMouseup(el2)
    * el3 = moveToCoordsOrNoop(coords)
    * if (notDetached(el1))
    *   sendClick(ancestorOf(el1, el2))
    */
    click (fromElViewport, forceEl, pointerEvtOptionsExtend = {}, mouseEvtOptionsExtend = {}) {
      debug('mouse.click', { fromElViewport, forceEl })

      const mouseDownPhase = mouse.down(fromElViewport, forceEl, pointerEvtOptionsExtend, mouseEvtOptionsExtend)

      const skipMouseupEvent = mouseDownPhase.events.pointerdown.preventedDefault

      const mouseUpPhase = mouse.up(fromElViewport, forceEl, skipMouseupEvent, pointerEvtOptionsExtend, mouseEvtOptionsExtend)

      const getElementToClick = () => {
        // Never skip the click event when force:true
        if (forceEl) {
          return { elToClick: forceEl }
        }

        // Only send click event if mousedown element is not detached.
        if ($elements.isDetachedEl(mouseDownPhase.targetEl) || $elements.isDetached(mouseUpPhase.targetEl)) {
          return { skipClickEventReason: 'element was detached' }
        }

        // Only send click event if element is not disabled.
        // First find an parent element that can actually be disabled
        const findParentThatCanBeDisabled = (el: HTMLElement): HTMLElement | null => {
          const elementsThatCanBeDisabled = ['button', 'input', 'select', 'textarea', 'optgroup', 'option', 'fieldset']

          return elementsThatCanBeDisabled.includes($elements.getTagName(el)) ? el : null
        }

        const parentThatCanBeDisabled = $elements.findParent(mouseUpPhase.targetEl, findParentThatCanBeDisabled) || $elements.findParent(mouseDownPhase.targetEl, findParentThatCanBeDisabled)

        // Then check if parent is indeed disabled
        if (parentThatCanBeDisabled !== null && $elements.isDisabled($(parentThatCanBeDisabled))) {
          return { skipClickEventReason: 'element was disabled' }
        }

        const commonAncestor = mouseUpPhase.targetEl &&
        mouseDownPhase.targetEl &&
        $elements.getFirstCommonAncestor(mouseUpPhase.targetEl, mouseDownPhase.targetEl)

        return { elToClick: commonAncestor }
      }

      const { skipClickEventReason, elToClick } = getElementToClick()

      const mouseClickEvents = mouse._mouseClickEvents(fromElViewport, elToClick, forceEl, skipClickEventReason, mouseEvtOptionsExtend)

      return _.extend({}, mouseDownPhase.events, mouseUpPhase.events, mouseClickEvents)
    },

    /**
     * @param {Coords} fromElViewport
     * @param {HTMLElement} el
     * @param {HTMLElement} forceEl
     * @param {Window} win
     */
    _upEvents (fromElViewport, forceEl, skipMouseEvent, pointerEvtOptionsExtend = {}, mouseEvtOptionsExtend = {}) {
      const win = state('window')

      let defaultOptions = mouse._getDefaultMouseOptions(fromElViewport.x, fromElViewport.y, win)

      const pointerEvtOptions = _.extend({}, defaultOptions, {
        ...defaultPointerDownUpOptions,
        buttons: 0,
      }, pointerEvtOptionsExtend)

      let mouseEvtOptions = _.extend({}, defaultOptions, {
        buttons: 0,
        detail: 1,
      }, mouseEvtOptionsExtend)

      const el = forceEl || mouse.moveToCoords(fromElViewport)

      let pointerup = sendPointerup(el, pointerEvtOptions)

      if (skipMouseEvent || $elements.isDetachedEl($(el))) {
        return {
          targetEl: el,
          events: {
            pointerup,
            mouseup: {
              skipped: formatReasonNotFired('Previous event cancelled'),
            },
          },
        }
      }

      let mouseup = sendMouseup(el, mouseEvtOptions)

      return {
        targetEl: el,
        events: {
          pointerup,
          mouseup,
        },
      }
    },

    _mouseClickEvents (fromElViewport, el, forceEl, skipClickEvent, mouseEvtOptionsExtend = {}) {
      if (skipClickEvent) {
        return {
          click: {
            skipped: formatReasonNotFired(skipClickEvent),
          },
        }
      }

      if (!forceEl) {
        mouse.moveToCoords(fromElViewport)
      }

      el = forceEl || el

      const win = $dom.getWindowByElement(el)

      const defaultOptions = mouse._getDefaultMouseOptions(fromElViewport.x, fromElViewport.y, win)

      const clickEventOptions = _.extend({}, defaultOptions, {
        buttons: 0,
        detail: 1,
      }, mouseEvtOptionsExtend)

      let click = sendClick(el, clickEventOptions, { force: !!forceEl })

      return { click }
    },

    _contextmenuEvent (fromElViewport, forceEl, mouseEvtOptionsExtend?) {
      const el = forceEl || mouse.moveToCoords(fromElViewport)

      const win = $dom.getWindowByElement(el)
      const defaultOptions = mouse._getDefaultMouseOptions(fromElViewport.x, fromElViewport.y, win)

      const mouseEvtOptions = _.extend({}, defaultOptions, {
        button: 2,
        buttons: 2,
        detail: 0,
        which: 3,
      }, mouseEvtOptionsExtend)

      let contextmenu = sendContextmenu(el, mouseEvtOptions)

      return { contextmenu }
    },

    dblclick (fromElViewport, forceEl, mouseEvtOptionsExtend = {}) {
      const click = (clickNum) => {
        const clickEvents = mouse.click(fromElViewport, forceEl, {}, { detail: clickNum })

        return clickEvents
      }

      const clickEvents1 = click(1)
      const clickEvents2 = click(2)

      const el = forceEl || mouse.moveToCoords(fromElViewport)
      const win = $dom.getWindowByElement(el)

      const dblclickEvtProps = _.extend(mouse._getDefaultMouseOptions(fromElViewport.x, fromElViewport.y, win), {
        buttons: 0,
        detail: 2,
      }, mouseEvtOptionsExtend)

      let dblclick = sendDblclick(el, dblclickEvtProps)

      return { clickEvents1, clickEvents2, dblclick }
    },

    rightclick (fromElViewport, forceEl) {
      const pointerEvtOptionsExtend = {
        button: 2,
        buttons: 2,
        which: 3,
      }
      const mouseEvtOptionsExtend = {
        button: 2,
        buttons: 2,
        which: 3,
      }

      const mouseDownPhase = mouse.down(fromElViewport, forceEl, pointerEvtOptionsExtend, mouseEvtOptionsExtend)

      const contextmenuEvent = mouse._contextmenuEvent(fromElViewport, forceEl)

      const skipMouseupEvent = mouseDownPhase.events.pointerdown.preventedDefault
      const mouseUpPhase = mouse.up(fromElViewport, forceEl, skipMouseupEvent, pointerEvtOptionsExtend, mouseEvtOptionsExtend)

      const clickEvents = _.extend({}, mouseDownPhase.events, mouseUpPhase.events)

      return _.extend({}, { clickEvents, contextmenuEvent })
    },
  }

  return mouse
}

const { stopPropagation } = window.MouseEvent.prototype

type SentEvent = {
  stoppedPropagation: boolean
  preventedDefault: boolean
  el: HTMLElement
  modifiers: string
}

const sendEvent = (evtName, el, evtOptions, bubbles = false, cancelable = false, Constructor, composed = false): SentEvent => {
  evtOptions = _.extend({}, evtOptions, { bubbles, cancelable })
  const _eventModifiers = $Keyboard.fromModifierEventOptions(evtOptions)
  const modifiers = $Keyboard.modifiersToString(_eventModifiers)

  const evt = new Constructor(evtName, _.extend({}, evtOptions, { bubbles, cancelable, composed }))

  if (bubbles) {
    evt.stopPropagation = function (...args) {
      evt._hasStoppedPropagation = true

      // stopPropagation doesn't have any arguments. So, we cannot type-safely pass the second argument.
      // But we're passing it just in case.
      // @ts-ignore
      return stopPropagation.apply(this, ...args)
    }
  }

  debug('event:', evtName, el)

  const preventedDefault = !el.dispatchEvent(evt)

  return {
    stoppedPropagation: !!evt._hasStoppedPropagation,
    preventedDefault,
    el,
    modifiers,
  }
}

const formatReasonNotFired = (reason) => {
  return `⚠️ not fired (${reason})`
}

type CoordsEventOptions = {
  x: number
  y: number
  clientX: number
  clientY: number
  screenX: number
  screenY: number
  pageX: number
  pageY: number
  layerX: number
  layerY: number
}

const toCoordsEventOptions = (x, y, win) => {
  // these are the coords from the element's window,
  // ignoring scroll position
  const { scrollX, scrollY } = win

  return {
    x,
    y,
    clientX: x,
    clientY: y,
    screenX: x,
    screenY: y,
    pageX: x + scrollX,
    pageY: x + scrollY,
    layerX: x + scrollX,
    layerY: x + scrollY,
  }
}

export interface Mouse extends ReturnType<typeof create> {}
