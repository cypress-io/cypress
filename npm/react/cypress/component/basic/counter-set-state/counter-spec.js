/// <reference types="cypress" />
/// <reference types="../../lib" />
import React from 'react'
import { mount } from 'cypress-react-unit-test'
import { Counter } from './counter.jsx'

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
})
