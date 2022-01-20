/* eslint-env browser */

export function init (importPromises: Array<() => Promise<void>>, parent: Window = (window.opener || window.parent)) {
  const Cypress = window.Cypress = parent.Cypress

  if (!Cypress) {
    throw new Error('Tests cannot run without a reference to Cypress!')
  }

  /**
   * When we create a listener from the runner for the AUT, we need to ensure the function
   * is sourced from the AUT, otherwise the event will not be associated correctly.
   *
   * We do this by creating a function from the AUT window, keeping in state to ensure we
   * only have a single fn
   *
   * https://github.com/cypress-io/cypress/pull/15995
   * https://github.com/cypress-io/cypress/issues/19697
   */
  Cypress.bridgeContentWindowListener = function (fn) {
    return function () {
      // @ts-ignore
      fn.apply(this, arguments)
    }
  }

  Cypress.onSpecWindow(window, importPromises)
  Cypress.action('app:window:before:load', window)
}
