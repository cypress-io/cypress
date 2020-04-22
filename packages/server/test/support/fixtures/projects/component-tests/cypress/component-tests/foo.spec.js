describe('component', () => {
  it('has spec with window same as app window', () => {
    cy.window().should('equal', window)
  })
})
