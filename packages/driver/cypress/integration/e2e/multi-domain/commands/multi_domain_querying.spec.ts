context('multi-domain querying', () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="dom-link"]').click()
  })

  it('.get()', () => {
    cy.switchToDomain('http://foobar.com:3500', () => {
      cy.get('#input')
    })
  })

  it('.contains()', () => {
    cy.switchToDomain('http://foobar.com:3500', () => {
      cy.contains('Nested Find')
    })
  })

  it('.within()', () => {
    cy.switchToDomain('http://foobar.com:3500', () => {
      cy.get('#by-id').within(() => {
        cy.get('#input')
      })
    })
  })

  it('.root()', () => {
    cy.switchToDomain('http://foobar.com:3500', () => {
      cy.root().should('match', 'html')
    })
  })
})
