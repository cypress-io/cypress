const $Keyboard = require('./keyboard')
const $dom = require('../dom')
const $elements = require('../dom/elements')
const $ = require('jquery')
const _ = require('lodash')

const { stopPropagation } = window.MouseEvent.prototype

/**
 *
 * @param {HTMLElement} el
 * @param {MouseEventInit} evtOptions
 */
const sendMouseenter = (el, evtOptions) => {
  const mouseenter = new MouseEvent('mouseenter', evtOptions)

  el.dispatchEvent(mouseenter)

}

/**
 *
 * @param {HTMLElement} el
 * @param {MouseEventInit} evtOptions
 */
const sendMouseover = (el, evtOptions) => {
  const mouseover = new MouseEvent('mouseover', evtOptions)

  el.dispatchEvent(mouseover)

}

/**
 *
 * @param {HTMLElement} el
 * @param {MouseEventInit} evtOptions
 */
const sendMouseout = (el, evtOptions) => {
  const mouseout = new MouseEvent('mouseout', evtOptions)

  el.dispatchEvent(mouseout)

}

/**
 *
 * @param {HTMLElement} el
 * @param {MouseEventInit} evtOptions
 */
const sendMouseleave = (el, evtOptions) => {
  const mouseleave = new MouseEvent('mouseleave', evtOptions)

  el.dispatchEvent(mouseleave)

}

/**
 *
 * @param {HTMLElement} el
 * @param {MouseEventInit} evtOptions
 */
const sendMousemove = (el, evtOptions) => {
  const mousemove = new MouseEvent('mousemove', evtOptions)

  el.dispatchEvent(mousemove)

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
      button: 0,
      which: 1,
      buttons: 1,
    })

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
      sendMouseout(this.lastHoveredEl, _.extend({}, defaultOptions, { relatedTarget: el }))

      let curParent = this.lastHoveredEl

      const elsToSendMouseleave = []

      while (curParent && curParent !== commonAncestor) {
        elsToSendMouseleave.push(curParent)
        curParent = curParent.parentNode
      }

      elsToSendMouseleave.forEach((elToSend) => {
        sendMouseleave(elToSend, _.extend({}, defaultOptions, { relatedTarget: el }))
      })

    }

    // if (Cypress.config('mousemoveBeforeMouseover') && el) {
    //   sendMousemove(el, defaultOptions)
    // }

    if (hoveredElChanged) {
      if (el && $elements.isAttached($(el))) {
        sendMouseover(el, _.extend({}, defaultOptions, { relatedTarget: this.lastHoveredEl }))

        let curParent = el
        const elsToSendMouseenter = []

        while (curParent && curParent !== commonAncestor) {
          elsToSendMouseenter.push(curParent)
          curParent = curParent.parentNode
        }

        _.reverse(elsToSendMouseenter).forEach((elToSend) => {
          sendMouseenter(elToSend, _.extend({}, defaultOptions, { relatedTarget: this.lastHoveredEl }))
        })
      }

      this.lastHoveredEl = $elements.isAttached($(el)) ? el : null
    }

    // if (!Cypress.config('mousemoveBeforeMouseover') && el) {
    sendMousemove(el, defaultOptions)
    // }

  },

  mouseDown ($elToClick, fromViewport) {
    const el = $elToClick.get(0)

    const win = $dom.getWindowByElement(el)

    // const mouseNeedsMove = !(fromViewport.x === this.mouseState.x && fromViewport.y === this.mouseState.y)
    this._moveMouse(el, { x: fromViewport.x, y: fromViewport.y })

    const mdownEvtProps = $Keyboard.mixinModifiers({
      bubbles: true,
      cancelable: true,
      view: win,
      clientX: fromViewport.x,
      clientY: fromViewport.y,
      buttons: 1,
      detail: 1,
    })

    const mdownEvt = new window.MouseEvent('mousedown', mdownEvtProps)

    // ensure this property exists on older chromium versions
    if (mdownEvt.buttons == null) {
      mdownEvt.buttons = 1
    }

    mdownEvt.stopPropagation = function (...args) {
      this._hasStoppedPropagation = true

      return stopPropagation.apply(this, args)
    }

    const cancelled = !el.dispatchEvent(mdownEvt)

    const props = {
      preventedDefault: cancelled,
      stoppedPropagation: !!mdownEvt._hasStoppedPropagation,
    }

    const modifiers = $Keyboard.activeModifiers()

    if (modifiers.length) {
      props.modifiers = modifiers.join(', ')
    }

    return props
  },

  mouseUp ($elToClick, fromViewport) {
    const el = $elToClick.get(0)

    const win = $dom.getWindowByElement(el)

    const mupEvtProps = $Keyboard.mixinModifiers({
      bubbles: true,
      cancelable: true,
      view: win,
      clientX: fromViewport.x,
      clientY: fromViewport.y,
      buttons: 0,
      detail: 1,
    })

    const mupEvt = new MouseEvent('mouseup', mupEvtProps)

    //# ensure this property exists on older chromium versions
    if (mupEvt.buttons == null) {
      mupEvt.buttons = 0
    }

    mupEvt.stopPropagation = function (...args) {
      this._hasStoppedPropagation = true

      return stopPropagation.apply(this, args)
    }

    const cancelled = !el.dispatchEvent(mupEvt)

    const props = {
      preventedDefault: cancelled,
      stoppedPropagation: !!mupEvt._hasStoppedPropagation,
    }

    const modifiers = $Keyboard.activeModifiers()

    if (modifiers.length) {
      props.modifiers = modifiers.join(', ')
    }

    return props
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
