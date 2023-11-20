import React from 'react'
import { mount } from '@cypress/react'
import Fetcher from './fetcher'

it('loads and displays greeting', () => {
  cy.intercept('/greeting', { greeting: 'Hello there' }).as('greet')

  const url = '/greeting'

  mount(<Fetcher url={url} />)

  cy.contains('Load Greeting').click()
  cy.get('[role=heading]').should('have.text', 'Hello there')
  cy.get('[role=button]').should('be.disabled')
  cy.get('@greet')
  .its('response.url')
  .should('match', /\/greeting$/)
})
