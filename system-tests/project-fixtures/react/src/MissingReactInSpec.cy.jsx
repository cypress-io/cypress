/// <reference types="cypress" />
import { mount } from 'cypress/react'
import { App } from './App'

it('is missing React in this file', () => {
  mount(<App />)
  cy.get('h1').contains('Hello World')
})
