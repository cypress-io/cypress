it('hidden check', () => {
  cy.visit('/fixtures/issue-28187.html')
  cy.get('details')
  .children('div')
  .should('not.be.visible')
})
