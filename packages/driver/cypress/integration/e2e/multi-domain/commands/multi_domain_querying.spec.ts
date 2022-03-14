// @ts-ignore / session support is needed for visiting about:blank between tests
context('multi-domain querying', { experimentalSessionSupport: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="dom-link"]').click()
  })

  it('.get()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.get('#input')
    })
  })

  it('.contains()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.contains('Nested Find')
    })
  })

  it('.within()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.get('#by-id').within(() => {
        cy.get('#input')
      })
    })
  })

  it('.root()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.root().should('match', 'html')
    })
  })
})
