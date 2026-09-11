import React from 'react'
import { mount } from '@cypress/react'
import Fetcher from './fetcher'

// The findBy* commands come from '@testing-library/cypress/add-commands',
// registered in cypress/support/component.jsx
// https://testing-library.com/docs/cypress-testing-library/intro
it('loads and displays greeting (testing-lib)', () => {
  cy.intercept('/greeting', { greeting: 'Hello there' }).as('greet')

  const url = '/greeting'

  mount(<Fetcher url={url} />)

  cy.findByText('Load Greeting')
  .wait(1000)
  .click()

  cy.findByRole('heading').should('have.text', 'Hello there')
  cy.findByRole('button').should('be.disabled')
  cy.get('@greet')
  .its('response.url')
  .should('match', /\/greeting$/)
})
