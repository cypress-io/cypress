/// <reference types="cypress" />
import { add } from './calc'

describe('Code coverage', () => {
  it('has code coverage object', () => {
    // there is an object created by Istanbul plugin
    cy.wrap(window)
    .its('__coverage__')
    // and it includes information even for this file
    .then(Object.keys)
    .should('include', Cypress.spec.absolute)
  })

  it('adds numbers', () => {
    expect(add(2, 3)).to.equal(5)
  })
})
