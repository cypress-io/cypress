// https://github.com/cypress-io/cypress/issues/2118
it('will exit even if an onbeforeunload dialog is present', function () {
  cy.visit('/fixtures/blocking_onbeforeunload.html')
})
