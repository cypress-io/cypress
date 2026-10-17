/// <reference types="cypress" />
import { mount } from '@cypress/vue'
import Users from './Users.vue'
// we can load list of mock users straight from JSON file
import mockUsers from './user.list.json'

import Axios from 'axios'

describe('Mocking axios.get with default import', () => {
  it('renders mocked data', () => {
    cy.stub(Axios, 'get')
    .as('get')
    .resolves({
      data: [
        {
          id: 101,
          name: 'Test User',
        },
      ],
    })

    mount(Users)
    // mock response is used
    cy.get('li').should('have.length', 1)
    cy.get('@get').should('have.been.calledOnce')
  })

  it('stubs with JSON loaded from fixture file', () => {
    cy.stub(Axios, 'get')
    .as('get')
    .resolves({
      data: mockUsers,
    })

    mount(Users)
    // mock response is used
    cy.get('li').should('have.length', 2)
    cy.get('@get').should('have.been.calledOnce')
  })
})
