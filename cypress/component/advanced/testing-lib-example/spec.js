import React from 'react'
import { mount } from 'cypress-react-unit-test'
import Fetcher from './fetcher'

it('loads and displays greeting', () => {
  cy.server()
  cy.route('/greeting', { greeting: 'Hello there' }).as('greet')

  const url = '/greeting'
  mount(<Fetcher url={url} />)

  cy.contains('Load Greeting').click()
  cy.get('[role=heading]').should('have.text', 'Hello there')
  cy.get('[role=button]').should('be.disabled')
  cy.get('@greet')
    .its('url')
    .should('match', /\/greeting$/)
})
