describe('remote driver: location in a cross-origin AUT', { experimentalRemoteDriver: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()
  })

  it('.hash()', () => {
    cy.hash().should('be.empty')
  })

  it('.location()', () => {
    cy.location().should((location) => {
      expect(location.href).to.equal('http://www.foobar.com:3500/fixtures/secondary-origin.html')
      expect(location.origin).to.equal('http://www.foobar.com:3500')
    })
  })

  it('.url()', () => {
    cy.url().should('equal', 'http://www.foobar.com:3500/fixtures/secondary-origin.html')
  })
})
