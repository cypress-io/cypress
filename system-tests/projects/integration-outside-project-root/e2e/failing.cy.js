/**
 * This tests the error UI for a certain webpack preprocessor setup.
 * It does this by having a test fail and then a subsequent test run that
 * verifies the appearance of the command log.
 */

import { fail, verify } from '../../e2e/cypress/support/util'

context('validation errors', function () {
  beforeEach(() => {
    // @ts-ignore
    window.top.__cySkipValidateConfig = true
    Cypress.config('isInteractive', true)
  })

  fail('validation error', this, () => {
    cy.viewport()
  })

  verify('validation error', this, {
    line: 17,
    column: 8,
    message: 'can only accept a string preset or',
    stack: ['throwErrBadArgs', 'From Your Spec Code:'],
  })
})
