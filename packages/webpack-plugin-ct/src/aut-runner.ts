/*eslint-env browser*/

export function init (importPromises, parent = (window.opener || window.parent)) {
  let Cypress = (window as any).Cypress = parent.Cypress

  if (!Cypress) {
    throw new Error('Tests cannot run without a reference to Cypress!')
  }

  return Cypress.onSpecWindow(window, importPromises)
}
