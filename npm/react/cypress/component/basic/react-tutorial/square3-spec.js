/// <reference types="cypress" />
import Square from './square3.jsx'
import React from 'react'
import { mount } from 'cypress-react-unit-test'

it('renders', () => {
  mount(<Square />)
  cy.get('.square')
    .should('have.text', '')
    .click()
  cy.contains('.square', 'X')
})
