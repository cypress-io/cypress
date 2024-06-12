it('will exit even if an beforeload event dialog is present', function () {
  cy.visit('/blocking_beforeunload_event.html')
})
