/// <reference types="cypress" />
import React from 'react'
import { mount } from 'cypress-react-unit-test'
import { App } from './app.jsx'
import { BrowserRouter as Router } from 'react-router-dom'

describe('React Router', () => {
  it('shows links', () => {
    cy.viewport(600, 300)
    mount(
      <Router>
        <App />
      </Router>,
    )

    cy.get('nav').should('be.visible')
    cy.contains('Home')
      .click()
      .location('pathname')
      .should('equal', '/') // Home route
    cy.contains('h2', 'Home')
    cy.contains('About')
      .click()
      .location('pathname')
      .should('equal', '/about') // About route
  })
})
