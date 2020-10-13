/// <reference types="cypress" />
import Square from './square4.jsx'
import React from 'react'
import { mount } from 'cypress-react-unit-test'
import './tic-tac-toe.css'

it('renders', () => {
  const onClick = cy.stub()
  mount(<Square value="O" onClick={onClick} />)
  cy.get('.square')
    .should('have.text', 'O')
    .click()
    .then(() => {
      expect(onClick).to.have.been.calledOnce
    })
})
