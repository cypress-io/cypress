it('will exit even if an onbeforeload dialog is present', function () {
  cy.visit('/fixtures/blocking_onbeforeunload.html')
})
