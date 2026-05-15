/// <reference types="cypress" />
'use strict'

import AjaxList from './AjaxList.vue'
import { mount } from '@cypress/vue'

const users = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  { id: 3, name: 'Charlie' },
]

describe('AjaxList', () => {
  context('using cy.intercept()', () => {
    // because this component loads data right away
    // we need to setup XHR intercepts BEFORE mounting it
    // thus each test will first do its "cy.intercept"
    // then will mount the component

    it('loads list of posts', () => {
      cy.intercept('GET', '/users?_limit=3', { body: users }).as('users')
      mount(AjaxList)
      cy.wait('@users')
      cy.get('li').should('have.length', 3)
    })

    it('can inspect intercepted XHR', () => {
      cy.intercept('GET', '/users?_limit=3', { body: users }).as('users')
      mount(AjaxList)

      cy.wait('@users').its('response.body').should('have.length', 3)
    })

    it('can display mock XHR response', () => {
      const singleUser = [{ id: 1, name: 'foo' }]

      cy.intercept('GET', '/users?_limit=3', { body: singleUser }).as('users')
      mount(AjaxList)

      cy.get('li').should('have.length', 1).first().contains('foo')
    })

    it('can inspect mocked XHR', () => {
      const singleUser = [{ id: 1, name: 'foo' }]

      cy.intercept('GET', '/users?_limit=3', singleUser).as('users')
      mount(AjaxList)

      cy.wait('@users').its('response.body').should('deep.equal', singleUser)
    })

    it('can delay and wait on XHR', () => {
      const singleUser = [{ id: 1, name: 'foo' }]

      cy.intercept({
        method: 'GET',
        url: '/users?_limit=3',
      }, {
        delay: 1000,
        body: singleUser,
      }).as('users')

      mount(AjaxList)

      cy.get('li').should('have.length', 0)
      cy.wait('@users')
      cy.get('li').should('have.length', 1)
    })
  })
})
