import { Transpiled } from '../../src/transpiled.jsx'
import React from 'react'

/* eslint-env mocha */
describe('Transpiled', () => {
  it('counts clicks', () => {
    cy.mount(<Transpiled />)
    cy.contains('count: 0')
      .click()
      .contains('count: 1')
      .click()
      .contains('count: 2')
  })

  it('counts clicks 2', () => {
    cy.mount(<Transpiled />)
    cy.contains('count: 0')
      .click()
      .contains('count: 1')
      .click()
      .contains('count: 2')
  })
})

describe('Counter cy.mounted before each test', () => {
  beforeEach(() => {
    cy.mount(<Transpiled />)
  })

  it('goes to 3', () => {
    cy.contains('count: 0')
      .click()
      .click()
      .click()
      .contains('count: 3')
  })

  it('has count in state', () => {
    cy.contains('count: 0')
      .click()
      .click()
      .click()
    cy.get(Transpiled)
      .its('state')
      .should('deep.equal', {count: 3})
  })
})
