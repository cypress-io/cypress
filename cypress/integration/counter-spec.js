import { Counter } from '../../src/counter.jsx'
import React from 'react'
import { mount } from '../../lib'

/* eslint-env mocha */
describe('Counter', () => {
  it('counts clicks', () => {
    mount(<Counter />)
    cy.contains('count: 0')
      .click()
      .contains('count: 1')
      .click()
      .contains('count: 2')
  })

  it('counts clicks 2', () => {
    mount(<Counter />)
    cy.contains('count: 0')
      .click()
      .contains('count: 1')
      .click()
      .contains('count: 2')
  })
})

describe('Counter mounted before each test', () => {
  beforeEach(() => {
    mount(<Counter />)
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
    Cypress.component().its('state')
      .should('deep.equal', {count: 3})
  })
})
