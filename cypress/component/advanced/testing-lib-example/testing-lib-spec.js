import React from 'react'
import { mount } from 'cypress-react-unit-test'
import Fetch from './fetch'

// https://testing-library.com/docs/cypress-testing-library/intro
import '@testing-library/cypress/add-commands'

it('loads and displays greeting (testing-lib)', () => {
  cy.server()
  cy.route('/greeting', { greeting: 'Hello there' }).as('greet')

  const url = '/greeting'
  mount(<Fetch url={url} />)

  cy.queryByText('Load Greeting')
    .wait(1000)
    .click()
  cy.queryByRole('heading').should('have.text', 'Hello there')
  cy.queryByRole('button').should('be.disabled')
  cy.get('@greet')
    .its('url')
    .should('match', /\/greeting$/)
})
