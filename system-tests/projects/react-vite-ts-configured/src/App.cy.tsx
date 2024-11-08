import React from 'react'
import { mount } from 'cypress/react'
import App from './App.tsx'

it('works', () => {
  mount(<App />)
  cy.contains('Learn React')
})
