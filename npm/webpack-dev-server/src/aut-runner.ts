/*eslint-env browser */

export function init (importPromises, parent: Window = (window.opener || window.parent)) {
  const Cypress = window.Cypress = parent.Cypress

  if (!Cypress) {
    throw new Error('Tests cannot run without a reference to Cypress!')
  }

  Cypress.onSpecWindow(window, importPromises)
  Cypress.action('app:window:before:load', window)
}
