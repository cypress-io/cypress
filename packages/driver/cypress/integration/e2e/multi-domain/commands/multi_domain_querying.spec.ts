// @ts-ignore / session support is needed for visiting about:blank between tests
context('multi-domain querying', { experimentalSessionSupport: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="dom-link"]').click()
  })

  it('.get()', () => {
    cy.origin('http://foobar.com:3500', () => {
      cy.get('#input')
    })
  })

  it('.contains()', () => {
    cy.origin('http://foobar.com:3500', () => {
      cy.contains('Nested Find')
    })
  })

  it('.within()', () => {
    cy.origin('http://foobar.com:3500', () => {
      cy.get('#by-id').within(() => {
        cy.get('#input')
      })
    })
  })

  it('.root()', () => {
    cy.origin('http://foobar.com:3500', () => {
      cy.root().should('match', 'html')
    })
  })
})
