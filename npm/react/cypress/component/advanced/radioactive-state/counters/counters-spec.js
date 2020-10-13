import './counters.css'
import React from 'react'
import { mount } from 'cypress-react-unit-test'
import Counters from './Counters.jsx'

describe('reactive-state Counters', () => {
  it('increments single count on click', () => {
    mount(
      <div className="App">
        <Counters />
      </div>,
    )
    cy.contains('.count', '0')
      .click()
      .click()
      .click()
    // increments the counter itself
    cy.contains('.count', '3')
    // increments the sum
    cy.contains('.sum', '3')

    // add two more counters
    cy.contains('Add Counter')
      .click()
      .click()
    cy.get('.counts .count').should('have.length', 3)
    // clicking the new counters increments the sum
    cy.get('.count')
      .eq(1)
      .click()
    cy.contains('.sum', '4')
    cy.get('.count')
      .eq(2)
      .click()
    cy.contains('.sum', '5')
  })
})
