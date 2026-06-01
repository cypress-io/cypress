// https://github.com/cypress-io/cypress/issues/2118
it('will exit even if an onbeforeunload dialog is present', function () {
  cy.visit('/fixtures/blocking_onbeforeunload.html')
})

// https://github.com/cypress-io/cypress/issues/2118
// navigating away from a page whose onbeforeunload handler requests a
// confirmation prompt must not block the next page load (previously hung
// until pageLoadTimeout in Electron)
it('can navigate away from a page with an onbeforeunload dialog', function () {
  cy.visit('/fixtures/blocking_onbeforeunload.html')
  cy.reload()
  cy.visit('/fixtures/dom.html')
})
