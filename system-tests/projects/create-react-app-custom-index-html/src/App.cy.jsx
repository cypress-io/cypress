import { mount } from 'cypress/react'
import React from 'react'
import App from './App'

it('works', () => {
  mount(<App />)
  cy.contains('Learn React')
  cy.get('body').should('have.css', 'background-color', 'rgb(255, 0, 0)')
})
