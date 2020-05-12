/// <reference types="cypress" />
import Card from './card.jsx'
import React from 'react'
import { mount } from 'cypress-react-unit-test'

// looking at the clock control from component's hook
// https://github.com/bahmutov/cypress-react-unit-test/issues/200
it('should select null after timing out (fast)', () => {
  const onSelect = cy.stub()
  // https://on.cypress.io/clock
  cy.clock()

  mount(<Card onSelect={onSelect} />)
  cy.get('button').should('have.length', 4)

  // component calls "onSelect" stub after 5 seconds of inactivity
  cy.tick(100).then(() => {
    // not yet
    expect(onSelect).to.not.have.been.called
  })
  cy.tick(1000).then(() => {
    // not yet
    expect(onSelect).to.not.have.been.called
  })
  cy.tick(1000).then(() => {
    // not yet
    expect(onSelect).to.not.have.been.called
  })
  cy.tick(1000).then(() => {
    // not yet
    expect(onSelect).to.not.have.been.called
  })
  cy.tick(1000).then(() => {
    // not yet
    expect(onSelect).to.not.have.been.called
  })
  cy.log('5 seconds passed')
  cy.tick(1000).then(() => {
    // NOW
    expect(onSelect).to.have.been.calledWith(null)
  })
})

it('should select null after timing out (slow)', () => {
  // without synthetic clock we must wait for the real delay
  const onSelect = cy.stub().as('selected')
  mount(<Card onSelect={onSelect} />)
  cy.get('@selected', { timeout: 5100 }).should('have.been.calledWith', null)
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
