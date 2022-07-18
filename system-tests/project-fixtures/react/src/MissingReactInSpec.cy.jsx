/// <reference types="cypress" />
import { App } from './App'

it('is missing React in this file', () => {
  cy.mount(<App />)
  cy.get('h1').contains('Hello World')
})
