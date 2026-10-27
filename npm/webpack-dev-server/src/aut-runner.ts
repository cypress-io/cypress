export function init (importPromises: Array<() => Promise<void>>, parent: Window = (window.opener || window.parent)) {
  // @ts-expect-error - Cypress is attached to the window at runtime and is not on the Window type
  const Cypress = window.Cypress = parent.Cypress

  if (!Cypress) {
    throw new Error('Tests cannot run without a reference to Cypress!')
  }

  Cypress.onSpecWindow(window, importPromises)
  Cypress.action('app:window:before:load', window)
}
