// test similar to https://reactjs.org/docs/testing-recipes.html#events
/// <reference types="cypress" />
import React from 'react'
import { mount } from 'cypress-react-unit-test'
import Toggle from './toggle'

it('changes value when clicked', () => {
  const onChange = cy.stub()
  mount(<Toggle onChange={onChange} />)

  cy.get('[data-testid=toggle]')
    .click()
    .then(() => {
      expect(onChange).to.have.been.calledOnce
    })
  cy.contains('button', 'Turn off').should('be.visible')

  cy.get('[data-testid=toggle]')
    .click()
    .click()
    .click()
    .click()
    .click()
    .then(() => {
      expect(onChange.callCount).to.equal(6)
    })
  cy.contains('button', 'Turn on').should('be.visible')
})
