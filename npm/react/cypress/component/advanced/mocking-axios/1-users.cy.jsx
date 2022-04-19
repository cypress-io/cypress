/// <reference types="cypress" />
import React from 'react'
import { mount } from '@cypress/react'
import { Users } from './1-users.jsx'
import axios from 'axios'

describe('Mocking Axios', () => {
  it('shows real users', () => {
    mount(<Users />)
    cy.get('li').should('have.length', 3)
  })

  // https://github.com/bahmutov/@cypress/react/issues/338
  // TODO: Support stubbing ES Modules. The above hack won't work with Vite.
  it.skip('mocks axios.get', () => {
    cy.stub(axios, 'get')
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
