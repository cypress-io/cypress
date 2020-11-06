import React from 'react'
import { mount } from '@cypress/react'
import Fetcher from './fetcher'

// https://testing-library.com/docs/cypress-testing-library/intro
// import '@testing-library/cypress/add-commands'

// NOTE: this doesn't work because of update to the @testing/library v7. Looks like build issue with current webpack config
it.skip('loads and displays greeting (testing-lib)', () => {
  cy.server()
  cy.route('/greeting', { greeting: 'Hello there' }).as('greet')

  const url = '/greeting'

  mount(<Fetcher url={url} />)

  cy.findByText('Load Greeting')
  .wait(1000)
  .click()

  cy.findByRole('heading').should('have.text', 'Hello there')
  cy.findByRole('button').should('be.disabled')
  cy.get('@greet')
  .its('url')
  .should('match', /\/greeting$/)
})
