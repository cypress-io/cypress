import React from 'react'
import { mount } from 'cypress-react-unit-test'
import App from './App.tsx'

describe('Sass and TS App', () => {
  it('has style', () => {
    mount(<App />)
    cy.get('.App').should('have.css', 'text-align', 'center')
  })
})
