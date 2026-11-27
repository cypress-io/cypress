describe('experimental driver: cy.env() in a cross-origin AUT', () => {
  it('reads environment variables after navigating to another origin', () => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('[data-cy="cookie-login-alias"]').click()
    cy.url().should('include', 'www.foobar.com')

    cy.env(['CY_ENV_FOO']).then(({ CY_ENV_FOO }) => {
      expect(CY_ENV_FOO).to.equal('foo')
    })
  })
})
