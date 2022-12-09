/// <reference types="cypress" />
/// <reference types="../../lib" />
import { Users } from './1-users.jsx'
import React from 'react'
import { mount } from '@cypress/react'

/* eslint-env mocha */
context('Users', () => {
  describe('Component', () => {
    it('fetches 3 users from remote API', () => {
      mount(<Users />)
      // fetching users can take a while
      cy.get('li', { timeout: 20000 }).should('have.length', 3)
    })
  })

  describe('Network State', () => {
    it('can inspect real data in XHR', () => {
      cy.intercept('/users?_limit=3').as('users')
      mount(<Users />)
      cy.wait('@users')
      .its('response.body')
      .should('have.length', 3)
      .its('0')
      .should('include.keys', ['id', 'name', 'username', 'email'])
    })

    it('can display mock XHR response', () => {
      const users = [{ id: 1, name: 'foo' }]

      cy.intercept('GET', '/users?_limit=3', users).as('users')
      mount(<Users />)
      cy.get('li')
      .should('have.length', 1)
      .first()
      .contains('foo')
    })

    it('can inspect mocked XHR', () => {
      const users = [{ id: 1, name: 'foo' }]

      cy.intercept('GET', '/users?_limit=3', users).as('users')
      mount(<Users />)
      cy.wait('@users')
      .its('response.body')
      .should('deep.equal', users)
    })

    it('can delay and wait on XHR', () => {
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
