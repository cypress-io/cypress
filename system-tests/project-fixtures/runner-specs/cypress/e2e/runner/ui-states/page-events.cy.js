describe('Page Events', () => {
  it('events - page events', () => {
    cy.visit('cypress/fixtures/commandsActions.html')

    cy.get('form').first().submit()

    cy.visit('cypress/fixtures/aliasing.html')
    cy.get('.network-btn').click()
  })
})
