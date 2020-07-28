it('t', () => {
  cy.visit('/fixtures/issue-486.html')

  cy.get('#button').click({
    ctrlKey: true,
  })

  cy.get('#result').should('contain', '{Ctrl}')
})

it('x', () => {
  cy.visit('/fixtures/issue-486.html')

  cy.get('#button').type('{ctrl}', { release: false })
  cy.get('#button').click()

  cy.get('#result').should('contain', '{Ctrl}')
})
