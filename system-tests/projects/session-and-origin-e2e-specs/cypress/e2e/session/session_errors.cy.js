it('setup has failing command', () => {
  cy.session('session_1', () => {
    cy.get('does_not_exist', { timeout: 500 })
  })
})
