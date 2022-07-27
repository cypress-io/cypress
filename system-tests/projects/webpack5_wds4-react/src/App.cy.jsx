import React from 'react'
import { App } from './App'
import { mount } from 'cypress/react'

it('renders hello world', () => {
  mount(<App />)
  // Click on the header here to ensure that the AUT is interactable. This ensures that the dev server overlay is not displaying
  cy.get('h1').contains('Hello World').click()
})
