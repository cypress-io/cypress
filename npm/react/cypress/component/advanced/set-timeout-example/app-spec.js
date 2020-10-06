/// <reference types="cypress" />
import React from 'react'
import { mount } from 'cypress-react-unit-test'
import App from './App'

// compare to test in
// https://github.com/bruceharris/react-unit-testing-example/blob/main/src/App.test.js

it('renders without crashing', () => {
  cy.viewport(800, 800)
  mount(<App />)
  // first the loading message is visible
  // then it changes
  cy.contains('isLoading: true').should('be.visible')
  cy.contains('isLoading: false').should('be.visible')
  cy.contains('ahoy!').should('be.visible')
})

it('loads really quickly', () => {
  cy.clock()
  cy.viewport(800, 800)
  mount(<App />)
  // first the loading message is visible
  // then it changes
  cy.contains('isLoading: true').should('be.visible')

  cy.tick(2010)
  cy.contains('isLoading: false').should('be.visible')
  cy.contains('ahoy!').should('be.visible')
})
