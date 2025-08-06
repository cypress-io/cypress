describe('this one should pass', () => {
  it('dispatches a key press', () => {
    cy.press(Cypress.Keyboard.Keys.TAB).then((val) => {
      expect(val).to.be.null
    })
  })
})
