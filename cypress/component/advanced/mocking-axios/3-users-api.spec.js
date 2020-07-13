/// <reference types="cypress" />
import React from 'react'
import { mount } from 'cypress-react-unit-test'
import { Users } from './3-users-api.jsx'
import * as Axios from './axios-api'

describe('Mocking wrapped Axios', () => {
  it('shows real users', () => {
    mount(<Users />)
    cy.get('li').should('have.length', 3)
  })

  it('mocks get', () => {
    console.log('Axios', Axios)
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
