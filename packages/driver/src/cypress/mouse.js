/* eslint-disable
    no-unused-vars,
    prefer-rest-params,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Promise = require('bluebird')

const $Cypress = require('../cypress')
const $Keyboard = require('./keyboard')
const $dom = require('../dom')

const { stopPropagation } = window.MouseEvent.prototype

module.exports = {
  mouseDown ($elToClick, fromViewport) {
    const el = $elToClick.get(0)

    const win = $dom.getWindowByElement(el)

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

    //# ensure this property exists on older chromium versions
    if (mdownEvt.buttons == null) {
      mdownEvt.buttons = 1
    }

    mdownEvt.stopPropagation = function () {
      this._hasStoppedPropagation = true

      return stopPropagation.apply(this, arguments)
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

    mupEvt.stopPropagation = function () {
      this._hasStoppedPropagation = true

      return stopPropagation.apply(this, arguments)
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

    clickEvt.stopPropagation = function () {
      this._hasStoppedPropagation = true

      return stopPropagation.apply(this, arguments)
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
