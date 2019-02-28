const $dom = require('../dom')
const $elements = require('../dom/elements')
const $ = require('jquery')
const _ = require('lodash')
const $Keyboard = require('./keyboard')
const $selection = require('../dom/selection')

/**
 * @typedef Coords
 * @property {number} x
 * @property {number} y
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

const getMouseCoords = (state) => {
  return state('mouseCoords')
}

const create = (state, focused) => {

  const mouse = {

    _getDefaultMouseOptions (x, y, win) {
      const _activeModifiers = $Keyboard.getActiveModifiers(state)
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
     * @param {HTMLElement | false} force
     */
    mouseMove ({ x, y }, force = false) {

      const coords = { x, y }

      const lastHoveredEl = getLastHoveredEl(state)

      const targetEl = mouse.getElAtCoordsOrForce(coords, force)

      // if coords are same AND we're already hovered on the element, don't send move events
      if (_.isEqual(coords, getMouseCoords(state)) && lastHoveredEl === targetEl) return { el: targetEl }

      const events = mouse._mouseMoveEvents(targetEl, coords)

      const resultEl = mouse.getElAtCoordsOrForce(coords, force)

      if (resultEl !== targetEl) {
        mouse._mouseMoveEvents(resultEl, coords)
      }

      return { el: resultEl, fromEl: lastHoveredEl, events }
    },

    /**
     * @param {HTMLElement} el
     * @param {Coords} coords
     */
    _mouseMoveEvents (el, coords) {

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

        while (curParent && curParent !== commonAncestor) {
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

      // if (!Cypress.config('mousemoveBeforeMouseover') && el) {
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
     * @param {HTMLElement} force
     * @returns {HTMLElement}
     */
    getElAtCoordsOrForce ({ x, y }, force = false) {
      if (force) {
        return force
      }

      const el = state('document').elementFromPoint(x, y)

      // mouse._mouseMoveEvents(el, { x, y })

      return el

    },

    /**
     *
     * @param {Coords} coords
     * @param {HTMLElement} force
     */
    moveToCoordsOrForce (coords, force = false) {
      if (force) {
        return force
      }

      const { el } = mouse.mouseMove(coords)

      return el
    },

    /**
     * @param {Coords} coords
     * @param {HTMLElement} force
     */
    _mouseDownEvents (coords, force, pointerEvtOptionsExtend = {}, mouseEvtOptionsExtend = {}) {

      const { x, y } = coords
      const el = mouse.moveToCoordsOrForce(coords, force)

      const win = $dom.getWindowByElement(el)

      const defaultOptions = mouse._getDefaultMouseOptions(x, y, win)

      const pointerEvtOptions = _.extend({}, defaultOptions, {
        button: 0,
        which: 1,
        buttons: 1,
        detail: 0,
        pressure: 0.5,
        pointerType: 'mouse',
        pointerId: 1,
        isPrimary: true,
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

    mouseDown (coords, force, pointerEvtOptionsExtend = {}, mouseEvtOptionsExtend = {}) {

      const $previouslyFocused = focused.getFocused()

      const mouseDownEvents = mouse._mouseDownEvents(coords, force, pointerEvtOptionsExtend, mouseEvtOptionsExtend)

      // el we just send pointerdown
      const el = mouseDownEvents.pointerdownProps.el

      if (mouseDownEvents.pointerdownProps.preventedDefault || mouseDownEvents.mousedownProps.preventedDefault || !$elements.isAttachedEl(el)) {
        return mouseDownEvents
      }

      //# retrieve the first focusable $el in our parent chain
      const $elToFocus = $elements.getFirstFocusableEl($(el))

      if (focused.needsFocus($elToFocus, $previouslyFocused)) {
        focused.fireFocus($elToFocus.get(0))

        //# if we are currently trying to focus
        //# the body then calling body.focus()
        //# is a noop, and it will not blur the
        //# current element, which is all so wrong
        if ($elToFocus.is('body')) {
          const $focused = focused.getFocused()

          //# if the current focused element hasn't changed
          //# then blur manually
          if ($elements.isSame($focused, $previouslyFocused)) {
            focused.fireBlur($focused.get(0))
          }
        }
      }

      const successfulFocus = $elements.isSame($elToFocus, focused.getFocused())

      if (successfulFocus && $elements.isTextEditableEl($elToFocus.get(0))) {
        if (!$elements.isNeedSingleValueChangeInputElement(el)) {
          $selection.moveSelectionToEnd()
        }
      }

      return mouseDownEvents
    },

    /**
     * @param {HTMLElement} el
     * @param {Window} win
     * @param {Coords} fromViewport
     * @param {HTMLElement} force
     */
    mouseUp (fromViewport, force, skipMouseEvent, pointerEvtOptionsExtend = {}, mouseEvtOptionsExtend = {}) {
      return mouse._mouseUpEvents(fromViewport, force, skipMouseEvent, pointerEvtOptionsExtend, mouseEvtOptionsExtend)
    },

    mouseClick (fromViewport, forceEl, pointerEvtOptionsExtend = {}, mouseEvtOptionsExtend = {}) {

      const mouseDownEvents = mouse.mouseDown(fromViewport, forceEl, pointerEvtOptionsExtend, mouseEvtOptionsExtend)

      const skipMouseupEvent = mouseDownEvents.pointerdownProps.skipped || mouseDownEvents.pointerdownProps.preventedDefault

      const mouseUpEvents = mouse.mouseUp(fromViewport, forceEl, skipMouseupEvent, pointerEvtOptionsExtend, mouseEvtOptionsExtend)

      const skipClickEvent = $elements.isDetachedEl(mouseDownEvents.pointerdownProps.el)

      const mouseClickEvents = mouse._mouseClickEvents(fromViewport, forceEl, skipClickEvent, mouseEvtOptionsExtend)

      return _.extend({}, mouseDownEvents, mouseUpEvents, mouseClickEvents)

    },

    /**
     * @param {HTMLElement} el
     * @param {Window} win
     * @param {Coords} fromViewport
     * @param {HTMLElement} force
     */
    _mouseUpEvents (fromViewport, force, skipMouseEvent, pointerEvtOptionsExtend = {}, mouseEvtOptionsExtend = {}) {

      const win = state('window')

      let defaultOptions = mouse._getDefaultMouseOptions(fromViewport.x, fromViewport.y, win)

      const pointerEvtOptions = _.extend({}, defaultOptions, {
        buttons: 0,
        pressure: 0.5,
        pointerType: 'mouse',
        pointerId: 1,
        isPrimary: true,
        detail: 0,
      }, pointerEvtOptionsExtend)

      let mouseEvtOptions = _.extend({}, defaultOptions, {
        buttons: 0,
        detail: 1,
      }, mouseEvtOptionsExtend)

      const el = mouse.moveToCoordsOrForce(fromViewport, force)

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

    _mouseClickEvents (fromViewport, force = false, skipClickEvent = false, mouseEvtOptionsExtend = {}) {
      const el = mouse.moveToCoordsOrForce(fromViewport, force)

      const win = $dom.getWindowByElement(el)

      const defaultOptions = mouse._getDefaultMouseOptions(fromViewport.x, fromViewport.y, win)

      const clickEventOptions = _.extend({}, defaultOptions, {
        buttons: 0,
        detail: 1,
      }, mouseEvtOptionsExtend)

      if (skipClickEvent) {
        return {
          clickProps: {
            skipped: formatReasonNotFired('Element was detached'),
          },
        }
      }

      let clickProps = sendClick(el, clickEventOptions)

      return { clickProps }
    },

    _contextmenuEvent (fromViewport, force, mouseEvtOptionsExtend) {
      const el = mouse.moveToCoordsOrForce(fromViewport, force)

      const win = $dom.getWindowByElement(el)
      const defaultOptions = mouse._getDefaultMouseOptions(fromViewport.x, fromViewport.y, win)

      const mouseEvtOptions = _.extend({}, defaultOptions, {
        button: 2,
        buttons: 2,
        detail: 0,
        which: 3,
      }, mouseEvtOptionsExtend)

      let contextmenuProps = sendContextmenu(el, mouseEvtOptions)

      return { contextmenuProps }
    },

    dblclick (fromViewport, force = false, mouseEvtOptionsExtend = {}) {
      const click = (clickNum) => {
        const clickEvents = mouse.mouseClick(fromViewport, force, {}, { detail: clickNum })

        return clickEvents
      }

      const clickEvents1 = click(1)
      const clickEvents2 = click(2)

      const el = mouse.moveToCoordsOrForce(fromViewport, force)
      const win = $dom.getWindowByElement(el)

      const dblclickEvtProps = _.extend(mouse._getDefaultMouseOptions(fromViewport.x, fromViewport.y, win), {
        buttons: 0,
        detail: 2,
      }, mouseEvtOptionsExtend)

      let dblclickProps = sendDblclick(el, dblclickEvtProps)

      return { clickEvents1, clickEvents2, dblclickProps }
    },

    rightclick (fromViewport, forceEl) {

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

      const mouseDownEvents = mouse.mouseDown(fromViewport, forceEl, pointerEvtOptionsExtend, mouseEvtOptionsExtend)

      const contextmenuEvent = mouse._contextmenuEvent(fromViewport, forceEl)

      const skipMouseupEvent = mouseDownEvents.pointerdownProps.skipped || mouseDownEvents.pointerdownProps.preventedDefault

      const mouseUpEvents = mouse.mouseUp(fromViewport, forceEl, skipMouseupEvent, pointerEvtOptionsExtend, mouseEvtOptionsExtend)

      const clickEvents = _.extend({}, mouseDownEvents, mouseUpEvents)

      return _.extend({}, { clickEvents, contextmenuEvent })

    },
  }

  return mouse
}

const { stopPropagation } = window.MouseEvent.prototype

const sendEvent = (evtName, el, evtOptions, bubbles = false, cancelable = false, constructor) => {
  evtOptions = _.extend({}, evtOptions, { bubbles, cancelable })
  const _eventModifiers = $Keyboard.fromModifierEventOptions(evtOptions)
  const modifiers = $Keyboard.modifiersToString(_eventModifiers)

  const evt = new constructor(evtName, _.extend({}, evtOptions, { bubbles, cancelable }))

  if (bubbles) {
    evt.stopPropagation = function (...args) {
      evt._hasStoppedPropagation = true

      return stopPropagation.apply(this, ...args)
    }
  }

  const preventedDefault = !el.dispatchEvent(evt)

  return {
    stoppedPropagation: !!evt._hasStoppedPropagation,
    preventedDefault,
    el,
    modifiers,
  }

}

const sendPointerEvent = (el, evtOptions, evtName, bubbles = false, cancelable = false) => {
  const constructor = el.ownerDocument.defaultView.PointerEvent

  return sendEvent(evtName, el, evtOptions, bubbles, cancelable, constructor)
}
const sendMouseEvent = (el, evtOptions, evtName, bubbles = false, cancelable = false) => {
  // IE doesn't have event constructors, so you should use document.createEvent('mouseevent')
  // https://dom.spec.whatwg.org/#dom-document-createevent
  const constructor = el.ownerDocument.defaultView.MouseEvent

  return sendEvent(evtName, el, evtOptions, bubbles, cancelable, constructor)
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

  // these are the coords from the document, ignoring scroll position
  const fromDocCoords = $elements.getFromDocCoords(x, y, win)

  return {
    clientX: x,
    clientY: y,
    screenX: x,
    screenY: y,
    x,
    y,
    pageX: fromDocCoords.x,
    pageY: fromDocCoords.y,
    layerX: fromDocCoords.x,
    layerY: fromDocCoords.y,
  }
}

module.exports = {
  create,
}
