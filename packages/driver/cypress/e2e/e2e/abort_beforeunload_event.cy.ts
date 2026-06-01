// https://github.com/cypress-io/cypress/issues/2118
it('will exit even if an beforeload event dialog is present', function () {
  cy.visit('/fixtures/blocking_beforeunload_event.html')
})

// https://github.com/cypress-io/cypress/issues/2118
// navigating away from a page with a beforeunload event listener that requests
// a confirmation prompt must not block the next page load (previously hung
// until pageLoadTimeout in Electron)
it('can navigate away from a page with a beforeunload event dialog', function () {
  cy.visit('/fixtures/blocking_beforeunload_event.html')
  cy.reload()
  cy.visit('/fixtures/dom.html')
})
