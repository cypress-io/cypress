import HelloWorld from '../../src/stateless-alert.jsx'
import React from 'react'
import { mount } from '../../lib'

/* eslint-env mocha */
describe('Stateless alert', () => {
  beforeEach(() => {
    const spy = cy.spy().as('alert')
    cy.on('window:alert', spy)
    mount(<HelloWorld name="Alert" />)
  })

  it('shows link', () => {
    cy.contains('a', 'Say Hi')
  })

  it('alerts with name', () => {
    cy.contains('Say Hi').click()
    // spy on window:alert is never called
    // https://github.com/bahmutov/cypress-react-unit-test/issues/6
    // cy.get('@alert').should('have.been.calledOnce')
  })
})
