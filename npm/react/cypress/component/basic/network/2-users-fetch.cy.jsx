/// <reference types="cypress" />
/// <reference types="../../lib" />
import { Users } from './2-users-fetch.jsx'
import React from 'react'
import { mount } from '@cypress/react'

describe('Users with Fetch', () => {
  it('fetches 3 users from remote API', () => {
    mount(<Users />)
    // fetching users can take a while
    cy.get('li', { timeout: 20000 }).should('have.length', 3)
  })

  // https://github.com/bahmutov/@cypress/react/issues/347
  context('mocking', () => {
    it('can inspect real data from the server', () => {
      // spy on the request
      cy.intercept('/users?_limit=3').as('users')
      mount(<Users />)
      cy.wait('@users')
      .its('response.body')
      .should('have.length', 3)
      .its('0')
      .should('include.keys', ['id', 'name', 'username', 'email'])
    })

    it('can stub and display mock network response', () => {
      const users = [{ id: 1, name: 'foo' }]

      // stub the request
      cy.intercept('GET', '/users?_limit=3', users).as('users')
      mount(<Users />)
      cy.get('li')
      .should('have.length', 1)
      .first()
      .contains('foo')
    })

    it('can inspect mocked network response', () => {
      const users = [{ id: 1, name: 'foo' }]

      cy.intercept('GET', '/users?_limit=3', users).as('users')
      mount(<Users />)
      cy.wait('@users')
      .its('response.body')
      .should('deep.equal', users)
    })

    it('can delay and wait on Ajax call', () => {
      const users = [{ id: 1, name: 'foo' }]

      cy.intercept('GET', '/users?_limit=3', {
        body: users,
        delay: 1000,
      }).as('users')

      mount(<Users />)
      cy.get('li').should('have.length', 0)
      cy.wait('@users')
      cy.get('li').should('have.length', 1)
    })
  })
})
