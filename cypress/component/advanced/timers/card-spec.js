/// <reference types="cypress" />
import Card from './card.jsx'
import React from 'react'
import { mount } from 'cypress-react-unit-test'

// NOTE: seems our clock control does not work with effect hooks
it.skip('should select null after timing out', () => {
  const onSelect = cy.stub()
  cy.clock()
  mount(<Card onSelect={onSelect} />)
  cy.tick(100).then(() => {
    expect(onSelect).to.not.have.been.called
  })
  cy.tick(5000).then(() => {
    expect(onSelect).to.have.been.calledWith(null)
  })
})

it('should accept selections', () => {
  const onSelect = cy.stub()
  mount(<Card onSelect={onSelect} />)
  cy.get("[data-testid='2']")
    .click()
    .then(() => {
      expect(onSelect).to.have.been.calledWith(2)
    })
})
