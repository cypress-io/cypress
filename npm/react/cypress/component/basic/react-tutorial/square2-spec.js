/// <reference types="cypress" />
import Square from './square2.jsx'
import React from 'react'
import { mount } from 'cypress-react-unit-test'

it('renders', () => {
  mount(<Square value="X" />)
  cy.on('window:alert', cy.stub().as('alerted'))
  cy.get('.square')
    .should('have.text', 'X')
    .click()
  cy.get('@alerted')
    .should('have.been.calledOnce')
    .and('have.been.calledWithExactly', 'click')
})
