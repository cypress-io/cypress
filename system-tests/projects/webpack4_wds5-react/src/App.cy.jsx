import React from 'react'
import { App } from './App'
import { mount } from 'cypress/reac18'

it('renders hello world', () => {
  mount(<App />)
  // Click on the header here to ensure that the AUT is interactable. This ensures that the dev server overlay is not displaying
  cy.get('h1').contains('Hello World').click()
})

it('renders background', () => {
  cy.mount(<App />)
  // Checks that the background color is applied even when sideEffects are set in package.json. This ensures css files are not tree shaken
  cy.get('h1').should('have.css', 'background-color', 'rgb(255, 0, 0)')
})
