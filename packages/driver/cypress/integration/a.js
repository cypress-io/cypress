it('t', () => {
  cy.visit('/fixtures/issue-486.html')

  cy.get('#button').click({
    ctrlKey: true,
  })

  cy.get('#result').should('contain', '{Ctrl}')
})
