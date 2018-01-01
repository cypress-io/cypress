import { HelloX, HelloState } from '../../src/hello-x.jsx'
import React from 'react'
import { mount } from '../../lib'

/* eslint-env mocha */
describe('HelloX component', () => {
  it('works', () => {
    mount(<HelloX name="SuperMan" />)
    cy.contains('Hello SuperMan!')
  })
})

describe('HelloState component', () => {
  it('changes state', () => {
    mount(<HelloState />)
    cy.contains('Hello Spider-man!')
    Cypress.component().invoke('setState', {name: 'React'})
    Cypress.component().its('state').should('deep.equal', {
      name: 'React'
    })
    cy.contains('Hello React!')
  })
})
