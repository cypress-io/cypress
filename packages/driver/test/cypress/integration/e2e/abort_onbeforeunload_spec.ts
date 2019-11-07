it('will exit even if an onbeforeunload dialog is present', function () {
  cy.visit('/fixtures/blocking_onbeforeunload.html')
})
