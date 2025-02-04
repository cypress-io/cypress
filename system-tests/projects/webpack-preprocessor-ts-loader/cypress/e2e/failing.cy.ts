/// <reference types="cypress" />
/**
 * This tests the error UI for a certain webpack preprocessor setup.
 * It does this by having a test fail and then a subsequent test run that
 * verifies the appearance of the command log.
 */

// simple example of typescript types, present to assert that this is being interpreted as TypeScript
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type Foo = {
  something: string
}

import { fail, verify } from '../../../e2e/cypress/support/util'

context('validation errors', function () {
  beforeEach(() => {
    // @ts-ignore
    window.top.__cySkipValidateConfig = true
    // @ts-ignore
    Cypress.config('isInteractive', true)
  })

  fail('validation error', this, () => {
    // @ts-ignore
    cy.viewport()
  })

  verify('validation error', this, {
    line: 19,
    isPreprocessorWithTypescript: true,
    message: 'can only accept a string preset or',
    stack: ['throwErrBadArgs', 'From Your Spec Code:'],
  })
})
