context('multi-domain window', () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="dom-link"]').click()
  })

  it('.window()', () => {
    cy.origin('http://foobar.com:3500', () => {
      cy.window().should('have.property', 'top')
    })
  })

  it('.document()', () => {
    cy.origin('http://foobar.com:3500', () => {
      cy.document().should('have.property', 'charset').and('eq', 'UTF-8')
    })
  })

  it('.title()', () => {
    cy.origin('http://foobar.com:3500', () => {
      cy.title().should('include', 'DOM Fixture')
    })
  })
})
