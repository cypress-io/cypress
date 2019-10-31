const $ = require('jquery')
const _ = require('lodash')
const $dom = require('../dom')
const $elements = require('../dom/elements')
const $Keyboard = require('./keyboard')
const $selection = require('../dom/selection')
const debug = require('debug')('cypress:driver:mouse')

/**
 * @typedef Coords
 * @property {number} x
 * @property {number} y
 * @property {Document} doc
 */

const getLastHoveredEl = (state) => {
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

const getMouseCoords = (state) => {
  return state('mouseCoords')
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

const shouldMoveCursorToEndAfterMousedown = (el) => {
  if (!$elements.isElement(el)) {
    return false
  }

  if (!($elements.isInput(el) || $elements.isTextarea(el) || $elements.isContentEditable(el))) {
    return false
  }

  if (!$elements.isFocused(el)) {
    return false
  }

  if ($elements.isNeedSingleValueChangeInputElement(el)) {
    return false
  }

  return true
}

const create = (state, keyboard, focused) => {
  const mouse = {
    _getDefaultMouseOptions (x, y, win) {
      const _activeModifiers = keyboard.getActiveModifiers(state)
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

    /**
     * @param {Coords} coords
     * @param {HTMLElement} forceEl
     */
    move (fromElViewport, forceEl) {
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
    _moveEvents (el, coords) {
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
      let pointerout = _.noop
      let pointerleave = _.noop
      let pointerover = notFired
      let pointerenter = _.noop
      let mouseout = _.noop
      let mouseleave = _.noop
      let mouseover = notFired
      let mouseenter = _.noop
      let pointermove = notFired
      let mousemove = notFired

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

        let curParent = lastHoveredEl

        const elsToSendMouseleave = []

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

          let curParent = el
          const elsToSendMouseenter = []

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

      const events = []

      pointerout()
      pointerleave()
      events.push({ pointerover: pointerover() })
      pointerenter()
      mouseout()
      mouseleave()
      events.push({ mouseover: mouseover() })
      mouseenter()
      state('mouseLastHoveredEl', $elements.isAttachedEl(el) ? el : null)
      state('mouseCoords', { x, y })
      events.push({ pointermove: pointermove() })
      events.push({ mousemove: mousemove() })

      return events
    },

    /**
     *
     * @param {Coords} coords
     * @returns {HTMLElement}
     */
    getElAtCoords ({ x, y, doc }) {
      const el = doc.elementFromPoint(x, y)

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
      let pointerdownProps = sendPointerdown(
        el,
        pointerEvtOptions
      )

      const pointerdownPrevented = pointerdownProps.preventedDefault
      const elIsDetached = $elements.isDetachedEl(el)

      if (pointerdownPrevented || elIsDetached) {
        let reason = 'pointerdown was cancelled'

        if (elIsDetached) {
          reason = 'Element was detached'
        }

        return {
          pointerdownProps,
          mousedownProps: {
            skipped: formatReasonNotFired(reason),
          },
        }
      }

      let mousedownProps = sendMousedown(el, mouseEvtOptions)

      return {
        pointerdownProps,
        mousedownProps,
      }
    },

    down (fromElViewport, forceEl, pointerEvtOptionsExtend = {}, mouseEvtOptionsExtend = {}) {
      const $previouslyFocused = focused.getFocused()

      const mouseDownEvents = mouse._downEvents(fromElViewport, forceEl, pointerEvtOptionsExtend, mouseEvtOptionsExtend)

      // el we just send pointerdown
      const el = mouseDownEvents.pointerdownProps.el

      if (mouseDownEvents.pointerdownProps.preventedDefault || mouseDownEvents.mousedownProps.preventedDefault || !$elements.isAttachedEl(el)) {
        return mouseDownEvents
      }

      //# retrieve the first focusable $el in our parent chain
      const $elToFocus = $elements.getFirstFocusableEl($(el))

      if (focused.needsFocus($elToFocus, $previouslyFocused)) {
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
          focused.fireFocus($elToFocus.get(0))
        }
      }

      if (shouldMoveCursorToEndAfterMousedown($elToFocus[0])) {
        debug('moveSelectionToEnd due to click')
        $selection.moveSelectionToEnd($dom.getDocumentFromElement($elToFocus[0]), { onlyIfEmptySelection: true })
      }

      return mouseDownEvents
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
    * if (notDetached(el1) && el1 === el2)
    *   sendClick(el3)
    */
    click (fromElViewport, forceEl, pointerEvtOptionsExtend = {}, mouseEvtOptionsExtend = {}) {
      debug('mouse.click', { fromElViewport, forceEl })

      const mouseDownEvents = mouse.down(fromElViewport, forceEl, pointerEvtOptionsExtend, mouseEvtOptionsExtend)

      const skipMouseupEvent = mouseDownEvents.pointerdownProps.skipped || mouseDownEvents.pointerdownProps.preventedDefault

      const mouseUpEvents = mouse.up(fromElViewport, forceEl, skipMouseupEvent, pointerEvtOptionsExtend, mouseEvtOptionsExtend)

      // Only send click event if the same element received both pointerdown and pointerup, and it's not detached.
      const getSkipClickEventAndReason = () => {
        // Never skip the click event when force:true
        if (forceEl) {
          return false
        }

        if ($elements.isDetachedEl(mouseDownEvents.pointerdownProps.el)) {
          return 'element was detached'
        }

        if (!mouseUpEvents.pointerupProps.el || mouseDownEvents.pointerdownProps.el !== mouseUpEvents.pointerupProps.el) {
          return 'mouseup and mousedown not received by same element'
        }

        // No reason to skip the click event
        return false
      }

      const skipClickEvent = getSkipClickEventAndReason()

      const mouseClickEvents = mouse._mouseClickEvents(fromElViewport, mouseDownEvents.pointerdownProps.el, forceEl, skipClickEvent, mouseEvtOptionsExtend)

      return _.extend({}, mouseDownEvents, mouseUpEvents, mouseClickEvents)
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

      let pointerupProps = sendPointerup(el, pointerEvtOptions)

      if (skipMouseEvent || $elements.isDetachedEl($(el))) {
        return {
          pointerupProps,
          mouseupProps: {
            skipped: formatReasonNotFired('Previous event cancelled'),
          },
        }
      }

      let mouseupProps = sendMouseup(el, mouseEvtOptions)

      return {
        pointerupProps,
        mouseupProps,
      }
    },

    _mouseClickEvents (fromElViewport, el, forceEl, skipClickEvent, mouseEvtOptionsExtend = {}) {
      if (skipClickEvent) {
        return {
          clickProps: {
            skipped: formatReasonNotFired(skipClickEvent),
          },
        }
      }

      if (!forceEl) {
        mouse.moveToCoords(fromElViewport)
      }

      const win = $dom.getWindowByElement(el)

      const defaultOptions = mouse._getDefaultMouseOptions(fromElViewport.x, fromElViewport.y, win)

      const clickEventOptions = _.extend({}, defaultOptions, {
        buttons: 0,
        detail: 1,
      }, mouseEvtOptionsExtend)

      let clickProps = sendClick(el, clickEventOptions)

      return { clickProps }
    },

    _contextmenuEvent (fromElViewport, forceEl, mouseEvtOptionsExtend) {
      const el = forceEl || mouse.moveToCoords(fromElViewport)

      const win = $dom.getWindowByElement(el)
      const defaultOptions = mouse._getDefaultMouseOptions(fromElViewport.x, fromElViewport.y, win)

      const mouseEvtOptions = _.extend({}, defaultOptions, {
        button: 2,
        buttons: 2,
        detail: 0,
        which: 3,
      }, mouseEvtOptionsExtend)

      let contextmenuProps = sendContextmenu(el, mouseEvtOptions)

      return { contextmenuProps }
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

      let dblclickProps = sendDblclick(el, dblclickEvtProps)

      return { clickEvents1, clickEvents2, dblclickProps }
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

      const mouseDownEvents = mouse.down(fromElViewport, forceEl, pointerEvtOptionsExtend, mouseEvtOptionsExtend)

      const contextmenuEvent = mouse._contextmenuEvent(fromElViewport, forceEl)

      const skipMouseupEvent = mouseDownEvents.pointerdownProps.skipped || mouseDownEvents.pointerdownProps.preventedDefault

      const mouseUpEvents = mouse.up(fromElViewport, forceEl, skipMouseupEvent, pointerEvtOptionsExtend, mouseEvtOptionsExtend)

      const clickEvents = _.extend({}, mouseDownEvents, mouseUpEvents)

      return _.extend({}, { clickEvents, contextmenuEvent })
    },
  }

  return mouse
}

const { stopPropagation } = window.MouseEvent.prototype

const sendEvent = (evtName, el, evtOptions, bubbles = false, cancelable = false, Constructor) => {
  evtOptions = _.extend({}, evtOptions, { bubbles, cancelable })
  const _eventModifiers = $Keyboard.fromModifierEventOptions(evtOptions)
  const modifiers = $Keyboard.modifiersToString(_eventModifiers)

  const evt = new Constructor(evtName, _.extend({}, evtOptions, { bubbles, cancelable }))

  if (bubbles) {
    evt.stopPropagation = function (...args) {
      evt._hasStoppedPropagation = true

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

const sendPointerEvent = (el, evtOptions, evtName, bubbles = false, cancelable = false) => {
  const Constructor = el.ownerDocument.defaultView.PointerEvent

  return sendEvent(evtName, el, evtOptions, bubbles, cancelable, Constructor)
}
const sendMouseEvent = (el, evtOptions, evtName, bubbles = false, cancelable = false) => {
  // TODO: IE doesn't have event constructors, so you should use document.createEvent('mouseevent')
  // https://dom.spec.whatwg.org/#dom-document-createevent
  const Constructor = el.ownerDocument.defaultView.MouseEvent

  return sendEvent(evtName, el, evtOptions, bubbles, cancelable, Constructor)
}

const sendPointerup = (el, evtOptions) => {
  return sendPointerEvent(el, evtOptions, 'pointerup', true, true)
}
const sendPointerdown = (el, evtOptions) => {
  return sendPointerEvent(el, evtOptions, 'pointerdown', true, true)
}
const sendPointermove = (el, evtOptions) => {
  return sendPointerEvent(el, evtOptions, 'pointermove', true, true)
}
const sendPointerover = (el, evtOptions) => {
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
  return sendMouseEvent(el, evtOptions, 'mouseup', true, true)
}
const sendMousedown = (el, evtOptions) => {
  return sendMouseEvent(el, evtOptions, 'mousedown', true, true)
}
const sendMousemove = (el, evtOptions) => {
  return sendMouseEvent(el, evtOptions, 'mousemove', true, true)
}
const sendMouseover = (el, evtOptions) => {
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
const sendClick = (el, evtOptions) => {
  return sendMouseEvent(el, evtOptions, 'click', true, true)
}
const sendDblclick = (el, evtOptions) => {
  return sendMouseEvent(el, evtOptions, 'dblclick', true, true)
}
const sendContextmenu = (el, evtOptions) => {
  return sendMouseEvent(el, evtOptions, 'contextmenu', true, true)
}

const formatReasonNotFired = (reason) => {
  return `⚠️ not fired (${reason})`
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

module.exports = {
  create,
}
