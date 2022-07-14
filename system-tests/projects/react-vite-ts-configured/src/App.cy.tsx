import React from 'react'
import { mount } from 'cypress/react'
import App from './App'

it('works', () => {
  mount(<App />)
  cy.contains('Learn React')
})

it('works with cy.mount custom command', () => {
  cy.mount(<App />)
  cy.contains('Learn React')
})
