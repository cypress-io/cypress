console.log('is this working?')

;(function (parent) {
  let Cypress = window.Cypress = parent.Cypress

  if (!Cypress) {
    throw new Error('Tests cannot run without a reference to Cypress!')
  }

  return Cypress.onSpecWindow(window, [])
})(window.opener || window.parent)
