import _ from 'lodash'
import $selection from '../dom/selection'

import type { ICypress } from '../cypress'
import type { StateFunc } from '../cypress/state'
import type { IFocused } from './focused'
import type { ISnapshots } from './snapshots'

export const create = (state: StateFunc, config: ICypress['config'], focused: IFocused, snapshots: ISnapshots) => {
  const wrapNativeMethods = function (contentWindow) {
    try {
      // return null to trick contentWindow into thinking
      // its not been iframed if modifyObstructiveCode is true
      if (config('modifyObstructiveCode')) {
        Object.defineProperty(contentWindow, 'frameElement', {
          get () {
            return null
          },
        })
      }

      contentWindow.HTMLElement.prototype.focus = function (focusOption) {
        return focused.interceptFocus(this, contentWindow, focusOption)
      }

      contentWindow.HTMLElement.prototype.blur = function () {
        return focused.interceptBlur(this)
      }

      contentWindow.SVGElement.prototype.focus = function (focusOption) {
        return focused.interceptFocus(this, contentWindow, focusOption)
      }

      contentWindow.SVGElement.prototype.blur = function () {
        return focused.interceptBlur(this)
      }

      contentWindow.HTMLInputElement.prototype.select = function () {
        return $selection.interceptSelect.call(this)
      }

      contentWindow.document.hasFocus = function () {
        return focused.documentHasFocus.call(this)
      }

      const cssModificationSpy = function (original, ...args) {
        snapshots.onCssModified(this.href)

        return original.apply(this, args)
      }

      const { insertRule } = contentWindow.CSSStyleSheet.prototype
      const { deleteRule } = contentWindow.CSSStyleSheet.prototype

      contentWindow.CSSStyleSheet.prototype.insertRule = _.wrap(insertRule, cssModificationSpy)
      contentWindow.CSSStyleSheet.prototype.deleteRule = _.wrap(deleteRule, cssModificationSpy)
    } catch (error) {} // eslint-disable-line no-empty
  }

  return {
    wrapNativeMethods,
  }
}

export interface IOverrides extends ReturnType<typeof create> {}
