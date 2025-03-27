describe('src/cy/commands/actions/press', () => {
  it('dispatches the tab keypress to the AUT', () => {
    cy.visit('/fixtures/input_events.html')
    cy.get('#focus').focus()
    cy.press(Cypress.Keyboard.Keys.TAB)

    cy.get('#keyup').should('have.value', 'Tab')

    cy.get('#keydown').should('have.value', 'Tab')

    cy.get('#keyup').type('sdfagasdfas')
  })
})
