/// <reference types="cypress" />
import React from 'react'
import { mount } from '@cypress/react'
import { Counter } from './counter.jsx'

/* eslint-env mocha */
describe('Counter with access', () => {
  it('works', () => {
    mount(<Counter />)
    cy.contains('count: 0')
    .click()
    .contains('count: 1')
    .click()
    .contains('count: 2')
  })

  it('allows access via reference', () => {
    mount(<Counter />)

    // the window.counter was set from the Counter's constructor
    cy.window()
    .should('have.property', 'counter')
    .its('count')
    .should('equal', 0)

    // let's change the state of the component
    cy.window()
    .its('counter')
    .invoke('setCount', 101)

    // the UI should update to reflect the new count
    cy.contains('count: 101').should('be.visible')
  })
})
