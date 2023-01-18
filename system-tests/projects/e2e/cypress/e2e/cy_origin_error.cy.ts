import { fail, verify } from '../support/util'

describe('cy.origin errors', () => {
  beforeEach(() => {
    // @ts-ignore
    window.top.__cySkipValidateConfig = true
    // must be interactive or stack trace is handled differently for the sake
    // of how it prints to stdout
    Cypress.config('isInteractive', true)

    cy.visit('/primary_origin.html')
    cy.get('a[data-cy="cross_origin_secondary_link"]').click()
  })

  fail('command failure', this, () => {
    cy.origin('http://www.foobar.com:4466', () => {
      cy.get('#doesnotexist', { timeout: 1 })
    })
  })

  verify('command failure', this, {
    line: 16,
    column: 8,
    message: 'Expected to find element',
    stack: ['cy_origin_error.cy.ts'],
    before () {
      cy.visit('/primary_origin.html')
    },
  })

  fail('failure when using dependency', this, () => {
    cy.origin('http://www.foobar.com:4466', () => {
      require('../support/util')

      cy.get('#doesnotexist', { timeout: 1 })
    })
  })

  verify('failure when using dependency', this, {
    line: 32,
    column: 8,
    message: 'Expected to find element',
    stack: ['cy_origin_error.cy.ts'],
    before () {
      cy.visit('/primary_origin.html')
    },
  })
})
