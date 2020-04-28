import React from 'react'
import { mount } from 'cypress-react-unit-test'
import Clicker from './clicker.jsx'

it('passes stub to the component', () => {
  const onClick = cy.stub().as('clicker')
  mount(<Clicker click={onClick} />)
  cy.get('button')
    .click()
    .click()
  cy.get('@clicker').should('have.been.calledTwice')
})
