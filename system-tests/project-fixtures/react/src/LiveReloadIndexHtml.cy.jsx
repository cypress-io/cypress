import React from 'react'
import { mount } from 'cypress/react'
import { App } from './App'

it('renders hello world', () => {
  mount(<App />)
  cy.get('body').should('have.css', 'background-color', 'rgb(255, 0, 0)')
})
