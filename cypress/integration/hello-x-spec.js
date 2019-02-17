import { HelloX, HelloState } from '../../src/hello-x.jsx'
import React from 'react'

/* eslint-env mocha */
describe('HelloX component', () => {
  it('works', () => {
    cy.mount(<HelloX name="SuperMan" />)
    cy.contains('Hello SuperMan!')
  })
})

describe('HelloState component', () => {
  it('changes state', () => {
    cy.mount(<HelloState />)
    cy.contains('Hello Spider-man!')
    const stateToSet = { name: 'React' }
    cy.get('@Component')
      .invoke('setState', stateToSet)
    cy.get('@Component')
      .its('state')
      .should('deep.equal', stateToSet)
    cy.contains('Hello React!')
  })
})
