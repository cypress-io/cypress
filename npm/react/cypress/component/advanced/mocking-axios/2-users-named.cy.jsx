/// <reference types="cypress" />
import React from 'react'
import { mount } from '@cypress/react'
import { Users } from './2-users-named.jsx'
import axios from 'axios'

describe('Mocking Axios named import get', () => {
  it('shows real users', () => {
    mount(<Users />)
    cy.get('li').should('have.length', 3)
  })

  // TODO: Support stubbing ES Modules
  it.skip('mocks get', () => {
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
