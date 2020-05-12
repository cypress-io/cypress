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

import { fail, setup, verify } from '../support/util'

setup({ verifyStackLineIsSpecFile: true })

context('validation errors', function () {
  describe('from cypress with docsUrl', function () {
    beforeEach(() => {
      Cypress.config('isInteractive', true)
    })

    fail(this, () => {
      cy.viewport()
    })

    verify(this, {
      line: 26, // this only has 1 test, so we can be specific
      column: 10,
      verifyDocsLearnMore: 'https://on.cypress.io/viewport',
      message: 'can only accept a string preset or',
      stack: ['throwErrBadArgs', 'From Your Spec Code:'],
    })
  })

  describe('from cypress without docsUrl', function () {
    beforeEach(() => {
      Cypress.config('isInteractive', false)
    })

    fail(this, () => {
      cy.viewport()
    })

    verify(this, {
      line: 44, // this only has 1 test, so we can be specific
      column: 10,
      verifyDocsContent: 'https://on.cypress.io/viewport',
      message: 'can only accept a string preset or',
      stack: ['throwErrBadArgs', 'From Your Spec Code:'],
    })
  })
})
