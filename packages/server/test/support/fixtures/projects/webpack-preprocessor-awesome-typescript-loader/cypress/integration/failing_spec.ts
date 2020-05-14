/// <reference types="cypress" />

/**
 * This tests various failure scenarios where an error and code frame is displayed
 * It does this by having a test fail and then a subsequent test run that
 * tests the appearance of the command log
 * Because of this, the test order is important
 * There should be the same number of failing tests as there are passing
 * tests, because each failure has a verification test (e.g. 11 fail, 11 pass)
 */

// simple example of typescript types
type Foo = {
  something: string
}

import { fail, setup, verify } from '../../../e2e/cypress/support/util'

setup({ verifyStackLineIsSpecFile: true })

context('validation errors', function () {
  beforeEach(() => {
    // @ts-ignore
    Cypress.config('isInteractive', true)
  })

  fail(this, () => {
    // @ts-ignore
    cy.viewport()
  })

  verify(this, {
    line: 29, // this only has 1 test, so we can be specific
    column: 8,
    message: 'can only accept a string preset or',
    stack: ['throwErrBadArgs', 'From Your Spec Code:'],
  })
})
