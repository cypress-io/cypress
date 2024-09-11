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

  // FIXME: @see https://github.com/cypress-io/cypress/issues/29614
  // projects using Typescript 5 do not calculate the userInvocationStack correctly,
  // leading to a small mismatch when linking stack traces back to the user's IDE from
  // the command log.
  verify('command failure', this, {
    line: 16,
    message: 'Expected to find element',
    stack: ['cy_origin_error.cy.ts'],
    before () {
      cy.visit('/primary_origin.html')
    },
    isCyOrigin: true,
  })

  fail('failure when using dependency', this, () => {
    cy.origin('http://www.foobar.com:4466', () => {
      Cypress.require('../support/util')

      cy.get('#doesnotexist', { timeout: 1 })
    })
  })

  // FIXME: @see https://github.com/cypress-io/cypress/issues/29614
  // projects using Typescript 5 do not calculate the userInvocationStack correctly,
  // leading to a small mismatch when linking stack traces back to the user's IDE from
  // the command log.
  verify('failure when using dependency', this, {
    line: 34,
    message: 'Expected to find element',
    stack: ['cy_origin_error.cy.ts'],
    before () {
      cy.visit('/primary_origin.html')
    },
    isCyOrigin: true,
  })
})
