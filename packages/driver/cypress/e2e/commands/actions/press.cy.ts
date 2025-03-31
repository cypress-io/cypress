describe('src/cy/commands/actions/press', () => {
  it('dispatches the tab keypress to the AUT', () => {
    if (Cypress.browser.family === 'firefox' && Cypress.browserMajorVersion() < 135) {
      return
    }

    cy.visit('/fixtures/input_events.html')

    cy.press(Cypress.Keyboard.Keys.TAB)

    cy.get('#keydown').should('have.value', 'Tab')

    cy.get('#keyup').should('have.value', 'Tab')
  })
})
