// https://github.com/cypress-io/cypress/issues/2118
it('will exit even if an onbeforeunload dialog is present in a child window', function () {
  cy.window().invoke('open', '/fixtures/blocking_onbeforeunload.html')
})
