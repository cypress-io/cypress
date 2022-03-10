// @ts-ignore / session support is needed for visiting about:blank between tests
context('multi-domain location', { experimentalSessionSupport: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="multi-domain-secondary-link"]').click()
  })

  it('.hash()', () => {
    cy.switchToDomain('http://foobar.com:3500', () => {
      cy.hash().should('be.empty')
    })
  })

  it('.location()', () => {
    cy.switchToDomain('http://foobar.com:3500', () => {
      cy.location().should((location) => {
        expect(location.href).to.equal('http://www.foobar.com:3500/fixtures/multi-domain-secondary.html')
        expect(location.origin).to.equal('http://www.foobar.com:3500')
      })
    })
  })

  it('.url()', () => {
    cy.switchToDomain('http://foobar.com:3500', () => {
      cy.url().should('equal', 'http://www.foobar.com:3500/fixtures/multi-domain-secondary.html')
    })
  })
})
