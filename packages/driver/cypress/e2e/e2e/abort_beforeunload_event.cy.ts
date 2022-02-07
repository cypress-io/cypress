// https://github.com/cypress-io/cypress/issues/2118
it('will exit even if an beforeload event dialog is present', function () {
  cy.visit('/fixtures/blocking_beforeunload_event.html')
})
