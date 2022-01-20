/* eslint-env browser */

export function init (importPromises: Array<() => Promise<void>>, parent: Window = (window.opener || window.parent)) {
  const Cypress = window.Cypress = parent.Cypress

  if (!Cypress) {
    throw new Error('Tests cannot run without a reference to Cypress!')
  }

  Cypress.bridgeContentWindowListener = function (fn) {
    return function () {
      // @ts-ignore
      fn.apply(this, arguments)
    }
  }

  Cypress.onSpecWindow(window, importPromises)
  Cypress.action('app:window:before:load', window)
}
