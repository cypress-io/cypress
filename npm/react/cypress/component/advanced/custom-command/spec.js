/// <reference types="cypress" />
/// <reference types="../../lib" />
import React from 'react'
import { mount } from 'cypress-react-unit-test'

// https://github.com/bahmutov/cypress-react-unit-test/issues/184
Cypress.Commands.add('myMount', () => {
  return mount(<div>My mount</div>)
})

Cypress.Commands.add('myMount2', () => {
  const toMount = React.createElement('div', null, ['mount 2'])
  return mount(toMount)
})

describe('Wrapped mount in custom command', () => {
  it('works', () => {
    cy.myMount()
    cy.contains('My mount')
  })

  it('works using React.createElement', () => {
    cy.myMount2()
    cy.contains('mount 2')
  })
})
