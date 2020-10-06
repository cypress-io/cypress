/// <reference types="cypress" />
import React from 'react'
import { mount } from 'cypress-react-unit-test'
import { App } from './app.jsx'
import { MemoryRouter } from 'react-router-dom'

describe('React Memory Router', () => {
  it('navigates through the link without changing url', () => {
    cy.viewport(600, 300)
    mount(
      <MemoryRouter
        initialEntries={['/about', '/two', { pathname: '/three' }]}
        initialIndex={0}
      >
        <App />
      </MemoryRouter>,
    )

    // we are mocking the initial open route with `initialIndex`
    // so we should see "About" component
    cy.log('**About** component')
    cy.contains('h2', 'About')
    // because the routing is in memory, the URL stays at the spec filename
    cy.location('pathname').should('match', /in-memory-spec.js$/)

    // Go to home route
    cy.contains('a', 'Home').click()

    cy.log('**Home** component')
    cy.contains('h2', 'Home') // from the "Home" component
    // still at the spec url
    cy.location('pathname').should('match', /in-memory-spec.js$/)

    // Go to about route
    cy.log('back to **About** component')
    cy.contains('a', 'About').click()

    cy.contains('h2', 'About')
    // still at the spec url
    cy.location('pathname').should('match', /in-memory-spec.js$/)
  })
})
