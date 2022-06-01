// https://github.com/cypress-io/cypress/issues/2118
it('will exit even if an beforeload event dialog is present in a child window', function () {
  cy.window().invoke('open', '/fixtures/blocking_beforeunload_event.html')
})
