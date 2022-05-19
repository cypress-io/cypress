import React from 'react'
import { mount } from 'cypress/react'
import { App } from './App'

it('renders hello world', () => {
  mount(<App />adf)
  cy.get('h1').contains('Hello World')
})
