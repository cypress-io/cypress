describe('CYPRESS env var', () => {
  it('checks that the CYPRESS env var exists in the plugin file', () => {
    cy.task('cypress:env').should('eq', 'true')
  })
})
