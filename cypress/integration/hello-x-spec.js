/// <reference types="cypress" />
/// <reference types="../../lib" />
import { HelloX, HelloState } from '../../src/hello-x.jsx'
import React from 'react'

/* eslint-env mocha */
describe('HelloX component', () => {
  it('works', () => {
    cy.mount(<HelloX name='SuperMan' />)
    cy.contains('Hello SuperMan!')
  })

  it('renders Unicode', () => {
    cy.mount(<HelloX name='🌎' />)
    cy.contains('Hello 🌎!')
    cy.percySnapshot('Hello globe')
    cy.wait(1000)
  })
})

describe('HelloState component', () => {
  it('changes state', () => {
    cy.mount(<HelloState />)
    cy.contains('Hello Spider-man!')
    const stateToSet = { name: 'React' }
    cy.get(HelloState).invoke('setState', stateToSet)
    cy.get(HelloState)
      .its('state')
      .should('deep.equal', stateToSet)
    cy.contains('Hello React!')
  })
})
