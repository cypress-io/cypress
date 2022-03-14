// @ts-ignore / session support is needed for visiting about:blank between tests
context('multi-domain window', { experimentalSessionSupport: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="dom-link"]').click()
  })

  it('.window()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.window().should('have.property', 'top')
    })
  })

  it('.document()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.document().should('have.property', 'charset').and('eq', 'UTF-8')
    })
  })

  it('.title()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.title().should('include', 'DOM Fixture')
    })
  })
})
