describe('__placeholder__/commands/actions/press', () => {
  it('dispatches the tab keypress to the AUT', () => {
    cy.visit('/fixtures/input_events.html')
    cy.screenshot()
    cy.get('#focus').focus().then(() => {
      return Cypress.automation('key:press', { key: 'Tab' })
    })

    cy.get('#keyup').should('have.value', 'Tab')

    cy.get('#keydown').should('have.value', 'Tab')
  })
})
