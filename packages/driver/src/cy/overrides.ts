import _ from 'lodash'
import { registerFetch } from 'unfetch'
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

      if (config('protocolEnabled')) {
        const originalAttachShadow = contentWindow.HTMLElement.prototype.attachShadow

        contentWindow.HTMLElement.prototype.attachShadow = function (options) {
          const returnVal = originalAttachShadow.call(this, options)

          // since scrolls on elements cannot see outside the shadowDOM, we want to attach
          // a scroll event to the shadowRoot and propagate a synthetic event to protocol
          if (this.shadowRoot) {
            // shadowRoot only exists on 'open' mode shadowRoots
            this.shadowRoot.addEventListener('scroll', (event) => {
              const isADocument =
                  event.target instanceof Document

              // if this is a scroll on an element, we want to propagate it.
              // otherwise, document scrolls will propagate to protocol
              if (!isADocument) {
                const syntheticScrollEvent = new CustomEvent('cypress:protocol:shadow-dom:element:scroll', {
                  bubbles: true,
                  composed: true,
                  detail: event,
                })

                this.dispatchEvent(syntheticScrollEvent)
              }
            }, true)

            this.shadowRoot.addEventListener('input', (event) => {
              // with inputs inside the shadow DOM, input events still bubble to the top document. However, their
              // event target is the actual shadow host that exists in the document, which makes sense since this is what information
              // the document has access to view. In order to receive correct target on events, we need to create a synthetic input event to sent
              // to protocol in order to capture correct keystrokes, radio input, selection boxes, etc
              const syntheticInputEvent = new CustomEvent('cypress:protocol:shadow-dom:element:input', {
                bubbles: true,
                composed: true,
                detail: event,
              })

              this.dispatchEvent(syntheticInputEvent)
            }, true)
          }

          return returnVal
        }
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

      if (config('experimentalFetchPolyfill')) {
        // drop "fetch" polyfill that replaces it with XMLHttpRequest
        // from the app iframe that we wrap for network stubbing
        contentWindow.fetch = registerFetch(contentWindow)
        // flag the polyfill to test this experimental feature easier
        state('fetchPolyfilled', true)
      }
    } catch (error) {} // eslint-disable-line no-empty
  }

  return {
    wrapNativeMethods,
  }
}

export interface IOverrides extends ReturnType<typeof create> {}
