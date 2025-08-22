/**
 * @vitest-environment jsdom
 */
import { vi, describe, it, expect, beforeEach } from 'vitest'

import source_map_utils from '../../../src/cypress/source_map_utils'
import stack_utils from '../../../src/cypress/stack_utils'
import stackFrameFixture from './__fixtures__/getInvocationDetails_spec_stackframes.json'

vi.mock('../../../src/cypress/source_map_utils', () => {
  return {
    default: {
      getSourcePosition: vi.fn(),
    },
  }
})

describe('stack_utils', () => {
  beforeEach(() => {
    // @ts-expect-error
    global.Cypress = {
      config: vi.fn(),
    }

    vi.resetAllMocks()
  })

  describe('getInvocationDetails', () => {
    const { line, column, scenarios } = stackFrameFixture

    const projectRoot = '/foo/bar'

    let stack: string

    class MockError {
      get stack () {
        return stack
      }
    }
    const config = () => projectRoot

    for (const scenario of scenarios) {
      const { browser, build, specFrame, stack: scenarioStack } = scenario

      describe(`${browser}:${build}`, () => {
        beforeEach(() => {
          stack = scenarioStack
        })

        it('calls getSourcePosition with the correct file, line, and column', () => {
          stack_utils.getInvocationDetails(
            { Error: MockError, Cypress: {} },
            config,
          )

          // getSourcePosition is not called directly from getInvocationDetails, but via:
          // - getSourceDetailsForFirstLine
          // - getSourceDetailsForLine
          expect(source_map_utils.getSourcePosition).toHaveBeenCalledWith(specFrame, expect.objectContaining({
            column,
            line,
            file: specFrame,
          }))
        })
      })
    }

    describe('@cypress/grep support', () => {
      it('skips grep wrapper functions and finds actual test invocation', () => {
        // Stack trace that includes cypress-grep wrapper functions
        stack = `Error
    at Object.getInvocationDetails (cypress:///../driver/src/cypress/stack_utils.ts:130:17)
    at Suite.addTest (cypress:///../driver/src/cypress/mocha.ts:462:85)
    at itGrep (https://example.cypress.io/__cypress/tests?p=cypress/support/e2e.js:391:14)
    at Suite.eval (https://example.cypress.io/__cypress/tests?p=cypress/e2e/spec.cy.js:19:3)
    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:141:19)
    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:42:27)
    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)`

        stack_utils.getInvocationDetails(
          { Error: MockError, Cypress: {} },
          config,
        )

        // Should skip the itGrep line and use the actual test line
        expect(source_map_utils.getSourcePosition).toHaveBeenCalledWith(
          'https://example.cypress.io/__cypress/tests?p=cypress/e2e/spec.cy.js',
          expect.objectContaining({
            file: 'https://example.cypress.io/__cypress/tests?p=cypress/e2e/spec.cy.js',
            line: 19,
            column: 3,
          }),
        )
      })

      it('skips describe grep wrapper functions and finds actual test invocation', () => {
        // Stack trace that includes describeGrep wrapper function
        stack = `Error
    at Object.getInvocationDetails (cypress:///../driver/src/cypress/stack_utils.ts:130:17)
    at Suite.addTest (cypress:///../driver/src/cypress/mocha.ts:462:85)
    at describeGrep (https://example.cypress.io/__cypress/tests?p=cypress/support/e2e.js:144:14)
    at Suite.eval (https://example.cypress.io/__cypress/tests?p=cypress/e2e/spec.cy.js:25:5)
    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:141:19)`

        stack_utils.getInvocationDetails(
          { Error: MockError, Cypress: {} },
          config,
        )

        // Should skip the describeGrep line and use the actual test line
        expect(source_map_utils.getSourcePosition).toHaveBeenCalledWith(
          'https://example.cypress.io/__cypress/tests?p=cypress/e2e/spec.cy.js',
          expect.objectContaining({
            file: 'https://example.cypress.io/__cypress/tests?p=cypress/e2e/spec.cy.js',
            line: 25,
            column: 5,
          }),
        )
      })

      it('handles multiple grep wrapper functions in stack', () => {
        // Stack trace with both itGrep and describeGrep
        stack = `Error
    at Object.getInvocationDetails (cypress:///../driver/src/cypress/stack_utils.ts:130:17)
    at Suite.addTest (cypress:///../driver/src/cypress/mocha.ts:462:85)
    at itGrep (https://example.cypress.io/__cypress/tests?p=cypress/support/e2e.js:391:14)
    at describeGrep (https://example.cypress.io/__cypress/tests?p=cypress/support/e2e.js:144:14)
    at Suite.eval (https://example.cypress.io/__cypress/tests?p=cypress/e2e/spec.cy.js:10:7)
    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:141:19)`

        stack_utils.getInvocationDetails(
          { Error: MockError, Cypress: {} },
          config,
        )

        // Should skip both grep lines and use the actual test line
        expect(source_map_utils.getSourcePosition).toHaveBeenCalledWith(
          'https://example.cypress.io/__cypress/tests?p=cypress/e2e/spec.cy.js',
          expect.objectContaining({
            file: 'https://example.cypress.io/__cypress/tests?p=cypress/e2e/spec.cy.js',
            line: 10,
            column: 7,
          }),
        )
      })
    })
  })
})
