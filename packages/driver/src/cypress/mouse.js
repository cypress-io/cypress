const $Keyboard = require('./keyboard')
const $dom = require('../dom')
const $elements = require('../dom/elements')
const $ = require('jquery')
const _ = require('lodash')

const { stopPropagation } = window.MouseEvent.prototype

const sendEvent = (evtName, el, evtOptions, bubbles = false, cancelable = false, constructor) => {
  evtOptions = _.extend({}, evtOptions, { bubbles, cancelable })
  const evt = new constructor(evtName, _.extend({}, evtOptions, { bubbles, cancelable }))

  if (bubbles) {
    evt.stopPropagation = function (...args) {
      this._hasStoppedPropagation = true

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

const $Mouse = {

  mouseState: {
    x: 0,
    y: 0,
  },

  lastHoveredEl: null,

  _setMouseState: (x, y) => {
    this.mouseState = { x, y }
  },

  _moveMouse (el, { x, y }) {
    this.mouseState = { x, y }
    this._moveMouseEvents(el, { x, y })
  },

  _moveMouseEvents (el, { x, y }) {
    const defaultOptions = $Keyboard.mixinModifiers({
      clientX: x,
      clientY: y,
      x,
      y,
      button: 0,
      which: 1,
      buttons: 1,
    })

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

    const lastHoveredElAttached = this.lastHoveredEl && $elements.isAttached($(el))

    if (!lastHoveredElAttached) {
      this.lastHoveredEl = null
    }

    const hoveredElChanged = el !== this.lastHoveredEl
    let commonAncestor = null

    if (hoveredElChanged) {
      commonAncestor = $elements.getFirstCommonAncestor(el, this.lastHoveredEl)
    }

    if (hoveredElChanged && this.lastHoveredEl) {
      pointerout = () => {
        sendPointerout(this.lastHoveredEl, _.extend({}, defaultOptions, { relatedTarget: el }))
      }
      mouseout = () => {
        sendMouseout(this.lastHoveredEl, _.extend({}, defaultOptions, { relatedTarget: el }))
      }

      let curParent = this.lastHoveredEl

      const elsToSendMouseleave = []

      while (curParent && curParent !== commonAncestor) {
        elsToSendMouseleave.push(curParent)
        curParent = curParent.parentNode
      }

      pointerleave = () => {
        elsToSendMouseleave.forEach((elToSend) => {
          sendPointerleave(elToSend, _.extend({}, defaultOptions, { relatedTarget: el }))
        })
      }
      mouseleave = () => {
        elsToSendMouseleave.forEach((elToSend) => {
          sendMouseleave(elToSend, _.extend({}, defaultOptions, { relatedTarget: el }))
        })
      }

    }

    // if (Cypress.config('mousemoveBeforeMouseover') && el) {
    //   sendMousemove(el, defaultOptions)
    // }

    if (hoveredElChanged) {
      if (el && $elements.isAttached($(el))) {

        mouseover = () => {
          sendMouseover(el, _.extend({}, defaultOptions, { relatedTarget: this.lastHoveredEl }))
        }
        pointerover = () => {
          sendPointerover(el, _.extend({}, defaultOptions, { relatedTarget: this.lastHoveredEl }))
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
            sendPointerenter(elToSend, _.extend({}, defaultOptions, { relatedTarget: this.lastHoveredEl }))
          })
        }
        mouseenter = () => {
          return elsToSendMouseenter.forEach((elToSend) => {
            sendMouseenter(elToSend, _.extend({}, defaultOptions, { relatedTarget: this.lastHoveredEl }))
          })
        }
      }

    }

    // if (!Cypress.config('mousemoveBeforeMouseover') && el) {
    pointermove = () => {
      sendPointermove(el, defaultOptions)
    }
    mousemove = () => {
      sendMousemove(el, defaultOptions)
    }
    pointerout && pointerout()
    pointerleave && pointerleave()
    pointerover && pointerover()
    pointerenter && pointerenter()
    mouseout && mouseout()
    mouseleave && mouseleave()
    mouseover && mouseover()
    mouseenter && mouseenter()
    this.lastHoveredEl = $elements.isAttached($(el)) ? el : null
    pointermove && pointermove()
    mousemove && mousemove()
    // }

  },

  mouseDown ($elToClick, fromViewport) {
    const el = $elToClick.get(0)
    const _activeModifiers = $Keyboard.activeModifiers()
    const modifiers = _activeModifiers.length ? _activeModifiers.join(', ') : null

    const defaultOptions = $Keyboard.mixinModifiers({
      clientX: x,
      clientY: y,
      x,
      y,
      button: 0,
      which: 1,
      buttons: 1,
    })

    // const mouseNeedsMove = !(fromViewport.x === this.mouseState.x && fromViewport.y === this.mouseState.y)
    const { x, y } = fromViewport

    this._moveMouse(el, { x, y })

    const pointerdownProps = sendPointerdown(el, defaultOptions)

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

  mouseUp ($elToClick, fromViewport, { pointerdownProps }) {
    const el = $elToClick.get(0)
    const win = $dom.getWindowByElement(el)

    const _activeModifiers = $Keyboard.activeModifiers()
    const modifiers = _activeModifiers.length ? _activeModifiers.join(', ') : null

    const defaultOptions = $Keyboard.mixinModifiers({
      view: win,
      clientX: fromViewport.x,
      clientY: fromViewport.y,
      buttons: 0,
      detail: 1,
    })

    const pointerupProps = sendPointerup(el, defaultOptions)

    if (pointerdownProps.preventedDefault) {
      return {
        pointerupProps,
        modifiers,
      }
    }

    const mouseupProps = sendMouseup(el, defaultOptions)

    return {
      pointerupProps,
      mouseupProps,
      modifiers,
    }
  },

  click ($elToClick, fromViewport) {
    const el = $elToClick.get(0)

    const win = $dom.getWindowByElement(el)

    const clickEvtProps = $Keyboard.mixinModifiers({
      bubbles: true,
      cancelable: true,
      view: win,
      clientX: fromViewport.x,
      clientY: fromViewport.y,
      buttons: 0,
      detail: 1,
    })

    const clickEvt = new MouseEvent('click', clickEvtProps)

    //# ensure this property exists on older chromium versions
    if (clickEvt.buttons == null) {
      clickEvt.buttons = 0
    }

    clickEvt.stopPropagation = function (...args) {
      this._hasStoppedPropagation = true

      return stopPropagation.apply(this, args)
    }

    const cancelled = !el.dispatchEvent(clickEvt)

    const props = {
      preventedDefault: cancelled,
      stoppedPropagation: !!clickEvt._hasStoppedPropagation,
    }

    const modifiers = $Keyboard.activeModifiers()

    if (modifiers.length) {
      props.modifiers = modifiers.join(', ')
    }

    return props
  },

}

module.exports = $Mouse
