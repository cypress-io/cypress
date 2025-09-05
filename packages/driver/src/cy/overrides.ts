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

      // Add ResizeObserver protection
      // to handle Chrome crashes when using ResizeObserver
      // https://github.com/cypress-io/cypress/issues/25443
      if (contentWindow.ResizeObserver) {
        const OriginalResizeObserver = contentWindow.ResizeObserver

        contentWindow.ResizeObserver = class extends OriginalResizeObserver {
          private _isProcessing = false
          private _lastCallbackTime = 0
          private _callbackCount = 0
          private _maxCallbacksPerSecond = 60 // Limit to 60fps

          constructor (callback: ResizeObserverCallback) {
            super((entries, observer) => {
            // Prevent excessive ResizeObserver callbacks
              const now = Date.now()
              const timeSinceLastCallback = now - this._lastCallbackTime

              if (timeSinceLastCallback < 16) { // ~60fps throttling
                return
              }

              // Prevent recursive calls
              if (this._isProcessing) {
                return
              }

              this._isProcessing = true
              this._lastCallbackTime = now
              this._callbackCount++

              try {
              // Check for problematic fractional dimensions
                const hasFractionalChanges = entries.some((entry) => {
                  const { width, height } = entry.contentRect

                  return width % 1 !== 0 || height % 1 !== 0
                })

                if (hasFractionalChanges) {
                // Block fractional dimension changes that cause Chrome crashes
                  return
                }

                callback(entries, observer)
              } catch (error) {
              // eslint-disable-next-line no-console
                console.error('[Cypress] ResizeObserver callback error:', error)
              } finally {
                this._isProcessing = false
              }
            })
          }
        }
      }
    } catch (error) {
    // eslint-disable-next-line no-console
      console.error('[Cypress] Error in wrapNativeMethods:', error)
    }
  }

  return {
    wrapNativeMethods,
  }
}

export interface IOverrides extends ReturnType<typeof create> {}
