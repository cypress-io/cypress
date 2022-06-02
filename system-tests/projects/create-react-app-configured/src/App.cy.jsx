import React from 'react'
import { mount } from 'cypress/react'
import App from './App'

it('works', () => {
  mount(<App />)
  cy.contains('Learn React')
})
