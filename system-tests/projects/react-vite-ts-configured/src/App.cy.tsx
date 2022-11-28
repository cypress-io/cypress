import React from 'react'
import { mount } from 'cypress/react17'
import App from './App'

it('works', () => {
  mount(<App />)
  cy.contains('Learn React')
})
