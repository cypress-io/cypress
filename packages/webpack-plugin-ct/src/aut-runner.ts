/*eslint-env browser*/

(function (parent) {
  let Cypress = (window as any).Cypress = parent.Cypress

  if (!Cypress) {
    throw new Error('Tests cannot run without a reference to Cypress!')
  }

  return Cypress.onSpecWindow(window, [])
})(window.opener || window.parent)
