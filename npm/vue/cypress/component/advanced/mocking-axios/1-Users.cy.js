/// <reference types="cypress" />
import { mount } from '@cypress/vue'
import Users from './1-Users.vue'
// we can load list of mock users straight from JSON file
import mockUsers from './user.list.json'

// import everything from "axios" module
// so we can mock its methods from the test
import Axios from 'axios'

// TODO: fix with https://github.com/cypress-io/cypress/issues/30706
describe.skip('Mocking get import from Axios', () => {
  it('renders mocked data', () => {
    cy.stub(Axios, 'get')
    .resolves({
      data: [
        {
          id: 101,
          name: 'Test User',
        },
      ],
    })
    .as('get')

    mount(Users)
    // mock response is used
    cy.get('li').should('have.length', 1)
    cy.get('@get').should('have.been.calledOnce')
  })

  it('stubs with JSON loaded from fixture file', () => {
    cy.stub(Axios, 'get')
    .resolves({
      data: mockUsers,
    })
    .as('get')

    mount(Users)
    // mock response is used
    cy.get('li').should('have.length', 2)
    cy.get('@get').should('have.been.calledOnce')
  })
})
