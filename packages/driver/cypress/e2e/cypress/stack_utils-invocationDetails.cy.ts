import type { InvocationDetails } from '../../../src/cypress/stack_utils'

// Note: the tests in this spec assert against their own invocation details. So if any of the line numbers change in this file, the assertions will need to be updated.
describe('stack_utils getInvocationDetails', () => {
  context('basic test invocation', () => {
    it('correctly extracts invocation details for Chrome', { browser: 'chrome' }, function () {
      // Get invocation details from Cypress object
      const details = Cypress.state('test').invocationDetails as InvocationDetails

      expect(details.function).to.equal('Suite.eval')
      expect(details.fileUrl).to.equal('http://localhost:3500/__cypress/tests?p=cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts')
      expect(details.originalFile).to.equal('webpack://@packages/driver/./cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts')
      expect(details.relativeFile).to.equal('cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts')
      expect(details.line).to.equal(6) // the line number should be the line number of the invocation of this test
      expect(details.column).to.equal(4)
      expect(details.absoluteFile).to.satisfy((file: string) => {
        return file.endsWith('cypress/packages/driver/cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts')
      })

      expect(details.stack).to.equal(`Error
    at Suite.eval (http://localhost:3500/__cypress/tests?p=cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts:9:5)
    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:141:19)
    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:42:27)
    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:128:31)
    at eval (cypress:///../driver/src/cypress/mocha.ts:189:14)`)
    })

    it('correctly extracts invocation details for Firefox', { browser: 'firefox' }, function () {
      const details = Cypress.state('test').invocationDetails as InvocationDetails

      expect(details.absoluteFile).to.satisfy((file: string) => {
        return file.endsWith('cypress/packages/driver/cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts')
      })

      expect(details.fileUrl).to.equal('http://localhost:3500/__cypress/tests?p=cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts')
      expect(details.originalFile).to.equal('webpack://@packages/driver/./cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts')
      expect(details.relativeFile).to.equal('cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts')
      expect(details.line).to.equal(28) // the line number should be the line number of the invocation of this test
      expect(details.column).to.equal(7)

      // the firefox traces are really long, so just validate the first line
      const firstLine = details.stack.split('\n')[0]

      expect(firstLine).to.equal('@http://localhost:3500/__cypress/tests?p=cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts:30:7')
    })
  })

  context('wrapped it function', () => {
    // Test case for when users re-define Mocha's it function
    // This creates additional stack frames that need to be trimmed correctly
    function myIt (name: string, optionsOrFn: any, fn?: () => void) {
      if (fn) {
        it(name, optionsOrFn, fn)
      } else {
        it(name, optionsOrFn)
      }
    }

    myIt('correctly extracts invocation details for wrapped it in Chrome', { browser: 'chrome' }, function () {
      const details = Cypress.state('test').invocationDetails as InvocationDetails

      expect(details.absoluteFile).to.satisfy((file: string) => {
        return file.endsWith('cypress/packages/driver/cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts')
      })

      expect(details.fileUrl).to.equal('http://localhost:3500/__cypress/tests?p=cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts')
      expect(details.function).to.equal('Suite.eval')
      expect(details.originalFile).to.equal('webpack://@packages/driver/./cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts')
      expect(details.relativeFile).to.equal('cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts')
      expect(details.line).to.equal(59) // the line number should be the line number of the invocation of this test
      expect(details.column).to.equal(4)
      expect(details.stack).to.equal(`Error
    at Suite.eval (http://localhost:3500/__cypress/tests?p=cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts:58:5)
    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:141:19)
    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:42:27)
    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:128:31)`)
    })

    myIt('correctly extracts invocation details for wrapped it in Firefox', { browser: 'firefox' }, function () {
      const details = Cypress.state('test').invocationDetails as InvocationDetails

      expect(details.absoluteFile).to.satisfy((file: string) => {
        return file.endsWith('cypress/packages/driver/cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts')
      })

      expect(details.fileUrl).to.equal('http://localhost:3500/__cypress/tests?p=cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts')
      expect(details.originalFile).to.equal('webpack://@packages/driver/./cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts')
      expect(details.relativeFile).to.equal('cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts')
      expect(details.line).to.equal(79) // the line number should be the line number of the invocation of this test
      expect(details.column).to.equal(9)

      // the firefox traces are really long, so just validate the first line
      const firstLine = details.stack.split('\n')[0]

      expect(firstLine).to.equal('@http://localhost:3500/__cypress/tests?p=cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts:77:9')
    })
  })
})
