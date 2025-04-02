describe('src/cy/commands/actions/press', () => {
  it('dispatches the tab keypress to the AUT', () => {
    // Non-BiDi firefox is not supported
    if (Cypress.browser.family === 'firefox' && Cypress.browserMajorVersion() < 135) {
      return
    }

    // TODO: Webkit is not supported. https://github.com/cypress-io/cypress/issues/31054
    if (Cypress.isBrowser('webkit')) {
      return
    }

    cy.visit('/fixtures/input_events.html')

    cy.press(Cypress.Keyboard.Keys.TAB)

    cy.get('#keydown').should('have.value', 'Tab')

    cy.get('#keyup').should('have.value', 'Tab')
  })
})
