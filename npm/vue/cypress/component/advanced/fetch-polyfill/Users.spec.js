/// <reference types="cypress" />
import { mount } from '@cypress/vue'
import Users from './Users.vue'

describe('Fetching users with polyfill', () => {
  it('renders real data', () => {
    // no mocking
    mount(Users)
    cy.get('.user').should('have.length', 3)
  })

  it('can spy on the fetch requests', () => {
    cy.server()
    cy.route('/users?_limit=3').as('users')
    mount(Users)
    cy.wait('@users')
    .its('responseBody.length')
    .then((length) => {
      cy.get('.user').should('have.length', length)
    })
  })

  it('shows loading UI while fetch is happening', () => {
    cy.server()
    cy.route({
      url: '/users?_limit=3',
      response: 'fixture:users',
      delay: 1000,
    })

    mount(Users)
    cy.get('.loading').should('be.visible')
    cy.get('.loading').should('not.exist')

    cy.get('.user').should('have.length', 2)
  })
})
