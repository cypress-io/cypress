import React from 'react'
import { mount } from 'cypress-react-unit-test'
import Counter from './counter.jsx'

describe('Counter using hooks', () => {
  it('works', () => {
    mount(<Counter />)
    cy.contains('You clicked 0 times')
    cy.contains('Click me')
      .click()
      .click()
      .click()
    cy.contains('You clicked 3 times')
  })
})
