/// <reference types="cypress" />
import Card from './card.jsx'
import React from 'react'
import { mount } from '@cypress/react'

it('should select null after timing out', () => {
  // without synthetic clock we must wait for the real delay
  const onSelect = cy.stub().as('selected')

  mount(<Card onSelect={onSelect} />)
  cy.get('@selected', { timeout: 5100 }).should('have.been.calledWith', null)
})

it('should accept selections', () => {
  const onSelect = cy.stub()

  mount(<Card onSelect={onSelect} />)
  cy.get('[data-testid=\'2\']')
  .click()
  .then(() => {
    expect(onSelect).to.have.been.calledWith(2)
  })
})
