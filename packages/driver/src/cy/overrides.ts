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

      // OPTIMIZATION 1: Batch DOM modifications to prevent multiple layout recalculations
      let pendingDOMModifications = new Set()
      let modificationTimeout: NodeJS.Timeout | null = null

      const batchDOMModifications = (callback: () => void) => {
        pendingDOMModifications.add(callback)

        if (modificationTimeout) {
          clearTimeout(modificationTimeout)
        }

        modificationTimeout = setTimeout(() => {
          // Use requestAnimationFrame to batch all modifications in a single frame
          requestAnimationFrame(() => {
            pendingDOMModifications.forEach((fn) => fn())
            pendingDOMModifications.clear()
            modificationTimeout = null
          })
        }, 0)
      }

      // OPTIMIZATION 2: Debounced focus/blur to prevent rapid layout changes
      const debouncedFocus = _.debounce(function (focusOption) {
        return focused.interceptFocus(this, contentWindow, focusOption)
      }, 16) // ~60fps throttling

      const debouncedBlur = _.debounce(function () {
        return focused.interceptBlur(this)
      }, 16)

      contentWindow.HTMLElement.prototype.focus = function (focusOption) {
        return batchDOMModifications(() => {
          return debouncedFocus.call(this, focusOption)
        })
      }

      contentWindow.HTMLElement.prototype.blur = function () {
        return batchDOMModifications(() => {
          return debouncedBlur.call(this)
        })
      }

      contentWindow.SVGElement.prototype.focus = function (focusOption) {
        return batchDOMModifications(() => {
          return debouncedFocus.call(this, focusOption)
        })
      }

      contentWindow.SVGElement.prototype.blur = function () {
        return batchDOMModifications(() => {
          return debouncedBlur.call(this)
        })
      }

      // OPTIMIZATION 3: Throttled select to prevent rapid text selection changes
      const throttledSelect = _.throttle(function () {
        return $selection.interceptSelect.call(this)
      }, 16)

      contentWindow.HTMLInputElement.prototype.select = function () {
        return batchDOMModifications(() => {
          return throttledSelect.call(this)
        })
      }

      // OPTIMIZATION 4: Cached document.hasFocus to prevent repeated DOM queries
      let cachedHasFocus: boolean | null = null
      let hasFocusCacheTimeout: NodeJS.Timeout | null = null

      contentWindow.document.hasFocus = function () {
        if (cachedHasFocus === null) {
          cachedHasFocus = focused.documentHasFocus.call(this)

          // Clear cache after a short delay
          if (hasFocusCacheTimeout) {
            clearTimeout(hasFocusCacheTimeout)
          }

          hasFocusCacheTimeout = setTimeout(() => {
            cachedHasFocus = null
            hasFocusCacheTimeout = null
          }, 100)
        }

        return cachedHasFocus
      }

      // OPTIMIZATION 5: Batched CSS modifications to prevent multiple layout recalculations
      let pendingCSSModifications: Array<{ original: Function, args: any[], context: any }> = []
      let cssModificationTimeout: NodeJS.Timeout | null = null

      const batchCSSModifications = (original: Function, args: any[], context: any) => {
        pendingCSSModifications.push({ original, args, context })

        if (cssModificationTimeout) {
          clearTimeout(cssModificationTimeout)
        }

        cssModificationTimeout = setTimeout(() => {
          // Batch all CSS modifications in a single frame
          requestAnimationFrame(() => {
            pendingCSSModifications.forEach(({ original, args, context }) => {
              snapshots.onCssModified(context.href)
              original.apply(context, args)
            })

            pendingCSSModifications = []
            cssModificationTimeout = null
          })
        }, 0)
      }

      const cssModificationSpy = function (original, ...args) {
        // Don't trigger immediate layout recalculation
        // Instead, batch the modification
        batchCSSModifications(original, args, this)

        // Return a promise-like object to maintain compatibility
        return {
          then: (resolve: Function) => {
            // Resolve after the batched modification
            setTimeout(() => resolve(original.apply(this, args)), 0)
          },
        }
      }

      const { insertRule } = contentWindow.CSSStyleSheet.prototype
      const { deleteRule } = contentWindow.CSSStyleSheet.prototype

      contentWindow.CSSStyleSheet.prototype.insertRule = _.wrap(insertRule, cssModificationSpy)
      contentWindow.CSSStyleSheet.prototype.deleteRule = _.wrap(deleteRule, cssModificationSpy)

      // OPTIMIZATION 6: Add ResizeObserver protection
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
