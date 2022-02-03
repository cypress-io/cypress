// https://github.com/cypress-io/cypress/issues/18069
// This fixture project is copied to packages/server/.project and executed there.
// Because of that, the reference path is wrong here.
/// <reference path="../../../../../../cli/types/mocha/index.d.ts" />
/// <reference path="../../../../../../cli/types/jquery/index.d.ts" />

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
    Cypress.config('isInteractive', true)
  })

  fail(this, () => {
    // @ts-ignore
    cy.viewport()
  })

  verify(this, {
    line: 29,
    column: 8,
    message: 'can only accept a string preset or',
    stack: ['throwErrBadArgs', 'From Your Spec Code:'],
  })
})
