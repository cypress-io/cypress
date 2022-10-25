describe('suite-level-only overrides run as expected', { testIsolation: 'off' }, () => {
  it('1st test passes', () => {
    cy.visit('https://example.cypress.io')
  })

  it('2nd test passes', () => {
    cy.url().should('eq', 'https://example.cypress.io/')
  })

  it('3rd test passes', () => {
    cy.url().should('eq', 'https://example.cypress.io/')
  })
})

describe('nested contexts ', () => {
  describe('nested suite-level-only overrides run as expected', { testIsolation: 'off' }, () => {
    it('1st test passes', () => {
      cy.visit('https://example.cypress.io')
    })

    it('2nd test passes', () => {
      cy.url().should('eq', 'https://example.cypress.io/')
    })

    it('3rd test passes', () => {
      cy.url().should('eq', 'https://example.cypress.io/')
    })
  })
})
