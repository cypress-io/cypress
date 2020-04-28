/// <reference types="cypress" />
import Square from './square1.jsx'
import React from 'react'
import { mount } from 'cypress-react-unit-test'

it('renders', () => {
  mount(<Square />)
  cy.on('window:alert', cy.stub().as('alerted'))
  cy.get('.square').click()
  cy.get('@alerted')
    .should('have.been.calledOnce')
    .and('have.been.calledWithExactly', 'click')
})
