describe('it should also pass', () => {
  it('dispatches a key press', () => {
    cy.press(Cypress.Keyboard.Keys.TAB)
  })
})
