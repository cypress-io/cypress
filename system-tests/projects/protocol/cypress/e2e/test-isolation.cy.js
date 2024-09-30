/* eslint-disable cypress/no-unnecessary-waiting */

describe('test isolation', { baseUrl: null }, () => {
  describe('test isolation false', { testIsolation: false }, () => {
    it('test 1', () => {
      cy.visit('cypress/fixtures/dom-with-browser-interactions.html')
      cy.wait(1000, { log: false })
      cy.get('#text-target').type('abc')
      cy.get('#text-target').should('have.value', 'abc')
    })

    it('test 2', () => {
      cy.get('#text-target').type('def')
      cy.get('#text-target').should('have.value', 'abcdef')
    })

    it('test 3', () => {
      cy.get('#text-target').type('ghi')
      cy.get('#text-target').should('have.value', 'abcdefghi')
    })

    it('test 4', () => {
      cy.get('#text-target').type('!')
      cy.get('#text-target').should('have.value', 'abcdefghi!')

      cy.visit('cypress/fixtures/dom-with-browser-interactions.html')
      cy.wait(1000, { log: false })
      cy.get('#text-target').type('abc')
      cy.get('#text-target').should('have.value', 'abc')
    })

    it('test 5', () => {
      cy.get('#text-target').type('!')
      cy.get('#text-target').should('have.value', 'abc!')
    })
  })

  describe('test isolation true', { testIsolation: true }, () => {
    it('test 6', () => {
      cy.visit('cypress/fixtures/dom-with-browser-interactions.html')
      cy.wait(1000, { log: false })
      cy.get('#text-target').type('abc')
      cy.get('#text-target').should('have.value', 'abc')
    })

    it('test 7', () => {
      cy.visit('cypress/fixtures/dom-with-browser-interactions.html')
      cy.wait(1000, { log: false })
      cy.get('#text-target').type('def')
      cy.get('#text-target').should('have.value', 'def')
    })
  })

  describe('test isolation false', { testIsolation: false }, () => {
    it('test 8', () => {
      cy.get('#text-target').type('abc')
      cy.get('#text-target').should('have.value', 'defabc')
    })
  })
})
