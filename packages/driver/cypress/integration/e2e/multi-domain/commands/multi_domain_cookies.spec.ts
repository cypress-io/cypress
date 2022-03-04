// @ts-ignore / session support is needed for visiting about:blank between tests
context('multi-domain cookies', { experimentalSessionSupport: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="multi-domain-secondary-link"]').click()
  })

  it('.getCookie(), .getCookies(), and .setCookie()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.getCookies().should('be.empty')

      cy.setCookie('foo', 'bar')

      cy.getCookie('foo').should('have.property', 'value', 'bar')
      cy.getCookies().should('have.length', 1)
    })
  })

  it('.clearCookie()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.setCookie('foo', 'bar')
      cy.getCookie('foo').should('not.be.null')
      cy.clearCookie('foo')
      cy.getCookie('foo').should('be.null')
    })
  })

  it('.clearCookies()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.setCookie('foo', 'bar')
      cy.setCookie('faz', 'baz')

      cy.getCookies().should('have.length', 2)
      cy.clearCookies()
      cy.getCookies().should('be.empty')
    })
  })
})
