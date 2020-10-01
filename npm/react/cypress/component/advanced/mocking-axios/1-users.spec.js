/// <reference types="cypress" />
import React from 'react'
import { mount } from 'cypress-react-unit-test'
import { Users } from './1-users.jsx'
// to mock CommonJS module loaded from `node_modules` use "require" in spec file
const Axios = require('axios')

describe('Mocking Axios', () => {
  it('shows real users', () => {
    mount(<Users />)
    cy.get('li').should('have.length', 3)
  })

  // https://github.com/bahmutov/cypress-react-unit-test/issues/338
  it('mocks axios.get', () => {
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

    mount(<Users />)
    // only the test user should be shown
    cy.get('li').should('have.length', 1)
    cy.get('@get').should('have.been.called')
  })

  it('restores the original method', () => {
    mount(<Users />)
    cy.get('li').should('have.length', 3)
  })
})
