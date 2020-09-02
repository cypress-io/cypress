/// <reference types="cypress" />
/// <reference types="../../lib" />
/// <reference types="@bahmutov/cy-api" />
import { Users } from './users.jsx'
import React from 'react'
import { mount } from 'cypress-react-unit-test'
// adds cy.api command
import '@bahmutov/cy-api/support'

// mixes component and API tests
describe('Component and API tests', () => {
  it('fetches and shows 3 users', () => {
    // no mocking, just real request to the backend REST endpoint
    mount(<Users />)
    // fetching users can take a while
    cy.get('li', { timeout: 20000 }).should('have.length', 3)
  })

  it('checks if API responds with a list of users', () => {
    cy.api({
      // same or similar URL to the one the component is using
      url: 'https://jsonplaceholder.cypress.io/users?_limit=3',
    })
      .its('body')
      .should('have.length', 3)
  })

  // another component test
  it('shows stubbed users', () => {
    cy.stub(window, 'fetch').resolves({
      json: cy
        .stub()
        .resolves([{ id: 101, name: 'Test User' }])
        .as('users'),
    })
    // no mocking, just real request to the backend REST endpoint
    mount(<Users />)
    cy.get('li').should('have.length', 1)
    cy.get('@users').should('have.been.calledOnce')
  })

  it('fetches one user from API', () => {
    cy.api({
      url: 'https://jsonplaceholder.cypress.io/users/1',
    })
      .its('body')
      .should('include', {
        id: 1,
        name: 'Leanne Graham',
      })
  })
})
