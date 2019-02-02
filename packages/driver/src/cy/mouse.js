const $dom = require('../dom')
const $elements = require('../dom/elements')
const $ = require('jquery')
const _ = require('lodash')
const $Keyboard = require('./keyboard')

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

const create = (state) => {

  const mouse = {

    /**
     * @param {Coords} coords
     * @param {HTMLElement | false} force
     */
    mouseMove (coords, force = false) {

      const lastHoveredEl = getLastHoveredEl(state)

      const targetEl = mouse.getElAtCoordsOrForce(coords, force)

      // if coords are same AND we're already hovered on the element, don't send move events
      if (_.isEqual(coords, getMouseCoords(state)) && lastHoveredEl === targetEl) return

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

      const _activeModifiers = $Keyboard.getActiveModifiers(state)
      const defaultMouseOptions = $Keyboard.mixinModifiers({
        clientX: x,
        clientY: y,
        screenX: x,
        screenY: y,
        x,
        y,
        button: 0,
        which: 0,
        buttons: 0,
        composed: true,
        view: win,
      }, _activeModifiers)

      const defaultPointerOptions = $Keyboard.mixinModifiers({
        clientX: x,
        clientY: y,
        screenX: x,
        screenY: y,
        x,
        y,
        button: -1,
        which: 0,
        buttons: 0,
        composed: true,
        view: win,
        pointerId: 1,
        pointerType: 'mouse',
        isPrimary: true,
      }, _activeModifiers)

      let pointerout = _.noop
      let pointerleave = _.noop
      let pointerover = _.noop
      let pointerenter = _.noop
      let mouseout = _.noop
      let mouseleave = _.noop
      let mouseover = _.noop
      let mouseenter = _.noop
      let pointermove = _.noop
      let mousemove = _.noop

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
    mouseDown (coords, force) {

      const { x, y } = coords
      const el = mouse.moveToCoordsOrForce(coords, force)

      const _activeModifiers = $Keyboard.getActiveModifiers(state)
      const modifiers = $Keyboard.modifiersToString(_activeModifiers)

      const win = $dom.getWindowByElement(el)

      // these are the coords from the document, ignoring scroll position
      const fromDocCoords = _getFromDocCoords(x, y, win)
      const defaultOptions = $Keyboard.mixinModifiers({
        clientX: x,
        clientY: y,
        pageX: fromDocCoords.x,
        pageY: fromDocCoords.y,
        layerX: fromDocCoords.x,
        layerY: fromDocCoords.y,
        screenX: fromDocCoords.x,
        screenY: fromDocCoords.y,
        x,
        y,
        button: 0,
        which: 1,
        // allow propagation out of root of shadow-dom
        // https://developer.mozilla.org/en-US/docs/Web/API/Event/composed
        composed: true,
        buttons: 1,
        // number of clicks in succession
        detail: 1,
        // only for events involving moving cursor
        relatedTarget: null,
        // currentTarget: el,
        view: win,
      }, _activeModifiers)

      // debugger

      // TODO: pointer events should have fractional coordinates, not rounded
      let pointerdownProps = sendPointerdown(
        el,
        _.extend({}, defaultOptions, {
          pressure: 0.5,
          pointerType: 'mouse',
          pointerId: 1,
          isPrimary: true,
          detail: 0,
        })
      )

      if (modifiers) {
        pointerdownProps = _.extend(pointerdownProps, { modifiers })
      }

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

      let mousedownProps = sendMousedown(el, defaultOptions)

      if (modifiers) {
        mousedownProps = _.extend(mousedownProps, { modifiers })
      }

      return {
        pointerdownProps,
        mousedownProps,
      }

    },

    /**
     * @param {HTMLElement} el
     * @param {Window} win
     * @param {Coords} fromViewport
     * @param {HTMLElement} force
     */
    mouseUp (fromViewport, force, skipMouseEvent) {

      // const win = $dom.getWindowByElement(el)

      const win = state('window')
      const _activeModifiers = $Keyboard.getActiveModifiers(state)
      const modifiers = $Keyboard.modifiersToString(_activeModifiers)

      const defaultOptions = $Keyboard.mixinModifiers({
        view: win,
        clientX: fromViewport.x,
        clientY: fromViewport.y,
        buttons: 0,
        detail: 1,
      }, _activeModifiers)

      // debugger
      const el = mouse.moveToCoordsOrForce(fromViewport, force)

      let pointerupProps = sendPointerup(el, defaultOptions)

      if (modifiers) {
        pointerupProps = _.extend(pointerupProps, { modifiers })
      }

      if (skipMouseEvent || $elements.isDetachedEl($(el))) {
        return {
          pointerupProps,
          mouseupProps: {
            skipped: formatReasonNotFired('Previous event cancelled'),
          },
        }
      }

      let mouseupProps = sendMouseup(el, defaultOptions)

      if (modifiers) {
        mouseupProps = _.extend(mouseupProps, { modifiers })
      }

      return {
        pointerupProps,
        mouseupProps,
      }

    },

    click (fromViewport, force = false, skipClickEvent = false) {
      const el = this.moveToCoordsOrForce(fromViewport, force)

      const win = $dom.getWindowByElement(el)
      const _activeModifiers = $Keyboard.getActiveModifiers(state)
      const modifiers = $Keyboard.modifiersToString(_activeModifiers)
      const clickEvtProps = $Keyboard.mixinModifiers({
        view: win,
        clientX: fromViewport.x,
        clientY: fromViewport.y,
        buttons: 0,
        detail: 1,
        composed: true,
      }, _activeModifiers)

      if (skipClickEvent) {
        return {
          clickProps: {
            skipped: formatReasonNotFired('Element was detached'),
          },
        }
      }

      let clickProps = sendClick(el, clickEvtProps)

      //// ensure this property exists on older chromium versions
      // if (clickEvt.buttons == null) {
      //   clickEvt.buttons = 0
      // }

      if (modifiers) {
        clickProps = _.extend(clickProps, { modifiers })
      }

      return { clickProps }
    },
  }

  return mouse
}

const { stopPropagation } = window.MouseEvent.prototype

const sendEvent = (evtName, el, evtOptions, bubbles = false, cancelable = false, constructor) => {
  evtOptions = _.extend({}, evtOptions, { bubbles, cancelable })
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

const formatReasonNotFired = (reason) => {
  return `⚠️ not fired (${reason})`
}

const _getFromDocCoords = (x, y, win) => {
  return {
    x: win.scrollX + x,
    y: win.scrollY + y,
  }
}

module.exports = {
  create,
}
