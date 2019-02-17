import { Users } from '../../src/users.jsx'
import React from 'react'

/* eslint-env mocha */
context('Users', () => {
  describe('Component', () => {
    it('fetches 3 users from remote API', () => {
      cy.mount(<Users />)
      cy.get('li').should('have.length', 3)
    })
  })

  describe('Network State', () => {
    beforeEach(() => {
      cy.server()
      // cy.mount the component after defining routes in tests
      // preventing race conditions where you wait on untouched routes
    })


    it('can inspect real data in XHR', () => {
      cy.route('/users?_limit=3').as('users')
      cy.mount(<Users />)
      cy.wait('@users').its('response.body').should('have.length', 3)
    })

    it('can display mock XHR response', () => {
      const users = [{id: 1, name: 'foo'}]
      cy.route('GET', '/users?_limit=3', users).as('users')
      cy.mount(<Users />)
      cy.get('li').should('have.length', 1)
        .first().contains('foo')
    })

    it('can inspect mocked XHR', () => {
      const users = [{id: 1, name: 'foo'}]
      cy.route('GET', '/users?_limit=3', users).as('users')
      cy.mount(<Users />)
      cy.wait('@users').its('response.body').should('deep.equal', users)
    })

    it('can delay and wait on XHR', () => {
      const users = [{id: 1, name: 'foo'}]
      cy.route({
        method: 'GET',
        url: '/users?_limit=3',
        response: users,
        delay: 1000
      }).as('users')
      cy.mount(<Users />)
      cy.get('li').should('have.length', 0)
      cy.wait('@users')
      cy.get('li').should('have.length', 1)
    })
  })
})
