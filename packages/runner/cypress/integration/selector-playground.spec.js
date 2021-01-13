const helpers = require('../support/helpers')

const { createCypress } = helpers
const { runIsolatedCypress } = createCypress()

describe('runner/cypress selector-playground.spec.js', () => {
  beforeEach(() => {
    runIsolatedCypress({})
    cy.get('.selector-playground-toggle').click()
    cy.get('.selector-playground').should('be.visible')
  })

  it('shows .get selector by default', () => {
    cy.get('.method button').contains('.get')
  })

  it('warns when selector is invalid', () => {
    cy.get('.selector-input').type('foo()')
    cy.get('.selector-playground').should('have.class', 'invalid-selector')
    cy.get('.num-elements').find('.fa-exclamation-triangle')
    // selector input shows red
    cy.get('.selector-input input').should('have.css', 'color', 'rgb(231, 76, 65)')
  })
})
