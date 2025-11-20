import type { InvocationDetails } from '../../../src/cypress/stack_utils'

// Create a custom it function that will add additional stack frames that need to be trimmed correctly
function myIt (name: string, optionsOrFn: any, fn?: () => void) {
  if (fn) {
    it(name, optionsOrFn, fn)
  } else {
    it(name, optionsOrFn)
  }
}

// Note: the tests in this spec assert against their own invocation details. So if any of the line numbers change in this file, the assertions will need to be updated.
it('has correct invocation details for a test at root level', () => {
  const details = Cypress.state('test').invocationDetails as InvocationDetails
  const isChromium = Cypress.isBrowser({ family: 'chromium' })
  const isFirefox = Cypress.isBrowser({ family: 'firefox' })

  expect(details.absoluteFile).to.satisfy((file: string) => {
    return file.endsWith('cypress/packages/driver/cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts')
  })

  expect(details.fileUrl).to.equal('http://localhost:3500/__cypress/tests?p=cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts')
  expect(details.originalFile).to.equal('webpack://@packages/driver/./cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts')
  expect(details.relativeFile).to.equal('cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts')
  expect(details.line).to.equal(13) // the line number should be the line number of the invocation of this test

  if (isChromium) {
    expect(details.column).to.equal(0)
    expect(details.function).to.equal('eval')
    expect(details.stack).to.equal(`Error
    at eval (http://localhost:3500/__cypress/tests?p=cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts:16:1)
    at eval (http://localhost:3500/__cypress/tests?p=cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts:155:12)
    at eval (<anonymous>)
    at eval (cypress:///../driver/src/cypress/script_utils.ts:38:23)
    at tryCatcher (cypress:///../../node_modules/bluebird/js/release/util.js:17:23)`)
  } else if (isFirefox) {
    expect(details.column).to.equal(3)
    expect(details.function).to.equal('<unknown>')

    // the firefox traces are really long, so just validate the first line
    const firstLine = details.stack.split('\n')[0]

    expect(firstLine).to.equal('@http://localhost:3500/__cypress/tests?p=cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts:16:3')
  }
})

myIt('has correct invocation details for myIt test at root level', function () {
  const details = Cypress.state('test').invocationDetails as InvocationDetails
  const isChromium = Cypress.isBrowser({ family: 'chromium' })
  const isFirefox = Cypress.isBrowser({ family: 'firefox' })

  expect(details.absoluteFile).to.satisfy((file: string) => {
    return file.endsWith('cypress/packages/driver/cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts')
  })

  expect(details.fileUrl).to.equal('http://localhost:3500/__cypress/tests?p=cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts')
  expect(details.originalFile).to.equal('webpack://@packages/driver/./cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts')
  expect(details.relativeFile).to.equal('cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts')
  expect(details.line).to.equal(47) // the line number should be the line number of the invocation of this test

  if (isChromium) {
    expect(details.function).to.equal('eval')
    expect(details.column).to.equal(0)
    expect(details.stack).to.equal(`Error
    at eval (http://localhost:3500/__cypress/tests?p=cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts:50:1)
    at eval (http://localhost:3500/__cypress/tests?p=cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts:155:12)
    at eval (<anonymous>)
    at eval (cypress:///../driver/src/cypress/script_utils.ts:38:23)`)
  } else if (isFirefox) {
    expect(details.column).to.equal(5)
    expect(details.function).to.equal('<unknown>')

    // the firefox traces are really long, so just validate the first line
    const firstLine = details.stack.split('\n')[0]

    expect(firstLine).to.equal('@http://localhost:3500/__cypress/tests?p=cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts:50:5')
  }
})

describe('outer describe block', () => {
  context('inner context block', () => {
    it('has correctinvocation details', function () {
      // Get invocation details from Cypress object
      const details = Cypress.state('test').invocationDetails as InvocationDetails
      const isChromium = Cypress.isBrowser({ family: 'chromium' })
      const isFirefox = Cypress.isBrowser({ family: 'firefox' })

      expect(details.absoluteFile).to.satisfy((file: string) => {
        return file.endsWith('cypress/packages/driver/cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts')
      })

      expect(details.fileUrl).to.equal('http://localhost:3500/__cypress/tests?p=cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts')
      expect(details.originalFile).to.equal('webpack://@packages/driver/./cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts')
      expect(details.relativeFile).to.equal('cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts')
      expect(details.line).to.equal(82) // the line number should be the line number of the invocation of this test

      if (isChromium) {
        expect(details.function).to.equal('Suite.eval')
        expect(details.column).to.equal(4)
        expect(details.stack).to.equal(`Error
    at Suite.eval (http://localhost:3500/__cypress/tests?p=cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts:85:5)
    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:141:19)
    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:42:27)
    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:128:31)
    at eval (cypress:///../driver/src/cypress/mocha.ts:189:14)`)
      } else if (isFirefox) {
        expect(details.column).to.equal(7)
        expect(details.function).to.equal('<unknown>')

        // the firefox traces are really long, so just validate the first line
        const firstLine = details.stack.split('\n')[0]

        expect(firstLine).to.equal('@http://localhost:3500/__cypress/tests?p=cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts:85:7')
      }
    })

    myIt('has correct invocation details for myIt test', function () {
      const details = Cypress.state('test').invocationDetails as InvocationDetails
      const isChromium = Cypress.isBrowser({ family: 'chromium' })
      const isFirefox = Cypress.isBrowser({ family: 'firefox' })

      expect(details.absoluteFile).to.satisfy((file: string) => {
        return file.endsWith('cypress/packages/driver/cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts')
      })

      expect(details.fileUrl).to.equal('http://localhost:3500/__cypress/tests?p=cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts')
      expect(details.originalFile).to.equal('webpack://@packages/driver/./cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts')
      expect(details.relativeFile).to.equal('cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts')
      expect(details.line).to.equal(117) // the line number should be the line number of the invocation of this test

      if (isChromium) {
        expect(details.function).to.equal('Suite.eval')
        expect(details.column).to.equal(4)
        expect(details.stack).to.equal(`Error
    at Suite.eval (http://localhost:3500/__cypress/tests?p=cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts:120:5)
    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:141:19)
    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:42:27)
    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:128:31)`)
      } else if (isFirefox) {
        expect(details.column).to.equal(9)

        // the firefox traces are really long, so just validate the first line
        const firstLine = details.stack.split('\n')[0]

        expect(firstLine).to.equal('@http://localhost:3500/__cypress/tests?p=cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts:120:9')
      }
    })
  })
})
