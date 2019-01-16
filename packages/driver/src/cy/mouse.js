const $dom = require('../dom')
const $elements = require('../dom/elements')
const $ = require('jquery')
const _ = require('lodash')
const $Keyboard = require('./keyboard')

const getLastHoveredEl = (state) => {
  let lastHoveredEl = state('mouseLastHoveredEl')
  const lastHoveredElAttached = lastHoveredEl && $elements.isAttached($(lastHoveredEl))

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

    _moveMouse (el, { x, y }) {
      // if coords are same AND we're already hovered on the element, don't send move events
      if (_.isEqual({ x, y }, getMouseCoords(state)) && getLastHoveredEl(state) === el) return

      state('mouseCoords', { x, y })
      mouse._moveMouseEvents(el, { x, y })
    },

    moveMouseToCoords ({ x, y }) {
      const el = state('document').elementFromPoint(x, y)

      mouse._moveMouse(el, { x, y })
    },

    _moveMouseEvents (el, { x, y }) {

      const win = $dom.getWindowByElement(el)

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

      let pointerout = null
      let pointerleave = null
      let pointerover = null
      let pointerenter = null
      let mouseout = null
      let mouseleave = null
      let mouseover = null
      let mouseenter = null
      let pointermove = null
      let mousemove = null

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
        if (el && $elements.isAttached($(el))) {

          mouseover = () => {
            sendMouseover(el, _.extend({}, defaultMouseOptions, { relatedTarget: lastHoveredEl }))
          }
          pointerover = () => {
            sendPointerover(el, _.extend({}, defaultPointerOptions, { relatedTarget: lastHoveredEl }))
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
        sendPointermove(el, defaultPointerOptions)
      }
      mousemove = () => {
        sendMousemove(el, defaultMouseOptions)
      }
      pointerout && pointerout()
      pointerleave && pointerleave()
      pointerover && pointerover()
      pointerenter && pointerenter()
      mouseout && mouseout()
      mouseleave && mouseleave()
      mouseover && mouseover()
      mouseenter && mouseenter()
      state('mouseLastHoveredEl', $elements.isAttached($(el)) ? el : null)
      pointermove && pointermove()
      mousemove && mousemove()
    // }

    },

    mouseDown ($elToClick, fromViewport) {
      const el = $elToClick.get(0)
      const { x, y } = fromViewport

      // debugger
      mouse._moveMouse(el, { x, y })

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
        currentTarget: el,
        view: win,
      }, _activeModifiers)

      // TODO: pointer events should have fractional coordinates, not rounded
      const pointerdownProps = sendPointerdown(
        el,
        _.extend({}, defaultOptions, {
          pressure: 0.5,
          pointerType: 'mouse',
          pointerId: 1,
          isPrimary: true,
          detail: 0,
        })
      )

      if (pointerdownProps.preventedDefault) {
        return {
          pointerdownProps,
          modifiers,
        }
      }

      const mousedownProps = sendMousedown(el, defaultOptions)

      return {
        pointerdownProps,
        mousedownProps,
        modifiers,
      }

    },

    /**
     * @param {HTMLElement} el
     * @param {Window} win
     * @param {{x:number,y:number}} fromViewport
     * @param {boolean} force
     */
    mouseUp (el, fromViewport, { pointerdownProps }, force) {
      const win = $dom.getWindowByElement(el)

      const _activeModifiers = $Keyboard.getActiveModifiers(state)
      const modifiers = $Keyboard.modifiersToString(_activeModifiers)

      const defaultOptions = $Keyboard.mixinModifiers({
        view: win,
        clientX: fromViewport.x,
        clientY: fromViewport.y,
        buttons: 0,
        detail: 1,
      }, _activeModifiers)

      const pointerupProps = sendPointerup(el, defaultOptions)

      if (pointerdownProps.preventedDefault) {
        return {
          pointerupProps,
          modifiers,
        }
      }

      // if (!force) {
      // const elAtCoords = win.document.elementFromPoint(fromViewport.x, fromViewport.y)

      // if (elAtCoords !== el) debugger
      // }

      const mouseupProps = $elements.isAttached(el) && sendMouseup(el, defaultOptions)

      return {
        pointerupProps,
        mouseupProps,
        modifiers,
      }
    },

    click ($elToClick, fromViewport) {
      const el = $elToClick.get(0)

      const win = $dom.getWindowByElement(el)
      const _activeModifiers = $Keyboard.getActiveModifiers(state)
      const clickEvtProps = $Keyboard.mixinModifiers({
        view: win,
        clientX: fromViewport.x,
        clientY: fromViewport.y,
        buttons: 0,
        detail: 1,
        composed: true,
      }, _activeModifiers)

      const clickProps = sendClick(el, clickEvtProps)

      //# ensure this property exists on older chromium versions
      // if (clickEvt.buttons == null) {
      //   clickEvt.buttons = 0
      // }

      return clickProps
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
  }

}

const sendPointerEvent = (el, evtOptions, evtName, bubbles = false, cancelable = false) => {
  const constructor = el.ownerDocument.defaultView.PointerEvent

  return sendEvent(evtName, el, evtOptions, bubbles, cancelable, constructor)
}
const sendMouseEvent = (el, evtOptions, evtName, bubbles = false, cancelable = false) => {
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

const _getFromDocCoords = (x, y, win) => {
  return {
    x: win.scrollX + x,
    y: win.scrollY + y,
  }
}

module.exports = {
  create,
}
