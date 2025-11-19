/**
 * @vitest-environment jsdom
 */
import { vi, describe, it, expect, beforeEach } from 'vitest'

import source_map_utils from '../../../src/cypress/source_map_utils'
import stack_utils from '../../../src/cypress/stack_utils'
import stackFrameFixture from './__fixtures__/getInvocationDetails_spec_stackframes.json'
import { Browser } from '@packages/types'

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
      isBrowser: vi.fn(() => true),
      testingType: 'e2e',
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
    const config = projectRoot

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

    describe('stack trimming', () => {
      let CypressWindow: Partial<Cypress.Cypress>

      describe('chromium', () => {
        beforeEach(() => {
          CypressWindow = {
            isBrowser: vi.fn(({ family }: Browser) => family === 'chromium') as any,
            testingType: 'e2e',
          }
        })

        it('returns the correct invocation details for a test stack trace that needs to be trimmed', () => {
          const stack = `Error
    at itGrep (http://localhost:3000/__cypress/tests?p=cypress/support/e2e.js:444:14)
    at eval (http://localhost:3000/__cypress/tests?p=cypress/e2e/spec.cy.js:14:1)
    at eval (http://localhost:3000/__cypress/tests?p=cypress/e2e/spec.cy.js:18:12)
    at eval (<anonymous>)
    at eval (cypress:///../driver/src/cypress/script_utils.ts:38:23)`

          class MockError {
            get stack () {
              return stack
            }
          }

          stack_utils.getInvocationDetails(
            { Error: MockError, Cypress: CypressWindow },
            config,
            'test',
          )

          expect(source_map_utils.getSourcePosition).toHaveBeenCalledWith('http://localhost:3000/__cypress/tests?p=cypress/e2e/spec.cy.js', expect.objectContaining({
            column: 1,
            line: 14,
            file: 'http://localhost:3000/__cypress/tests?p=cypress/e2e/spec.cy.js',
          }))
        })

        it('does not trim component testing stack traces', () => {
          CypressWindow = {
            isBrowser: vi.fn(({ family }: Browser) => family === 'chromium') as any,
            testingType: 'component',
          }

          const stack = `Error
            at itGrep (http://localhost:3000/__cypress/tests?p=cypress/support/e2e.js:444:14)
            at context.notIt.only (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:98:46)
            at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)
            at itGrep.eval [as only] (cypress:///../driver/src/cypress/mocha.ts:187:14)
            at Suite.eval (http://localhost:3000/__cypress/tests?p=cypress/e2e/spec.cy.js:12:6)`

          class MockError {
            get stack () {
              return stack
            }
          }

          stack_utils.getInvocationDetails(
            { Error: MockError, Cypress: CypressWindow },
            config,
            'test',
          )

          // calls `getSourcePosition` with the top line of the stack because it was not modified
          expect(source_map_utils.getSourcePosition).toHaveBeenCalledWith('http://localhost:3000/__cypress/tests?p=cypress/support/e2e.js', expect.objectContaining({
            column: 14,
            line: 444,
            file: 'http://localhost:3000/__cypress/tests?p=cypress/support/e2e.js',
          }))
        })

        it('returns the correct invocation details for a .only test with a stack that needs to be trimmed', () => {
          const stack = `Error
        at itGrep (http://localhost:3000/__cypress/tests?p=cypress/support/e2e.js:444:14)
        at context.notIt.only (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:98:46)
        at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)
        at itGrep.eval [as only] (cypress:///../driver/src/cypress/mocha.ts:187:14)
        at Suite.eval (http://localhost:3000/__cypress/tests?p=cypress/e2e/spec.cy.js:12:6)`

          class MockError {
            get stack () {
              return stack
            }
          }

          stack_utils.getInvocationDetails(
            { Error: MockError, Cypress: CypressWindow },
            config,
            'test',
          )

          expect(source_map_utils.getSourcePosition).toHaveBeenCalledWith('http://localhost:3000/__cypress/tests?p=cypress/e2e/spec.cy.js', expect.objectContaining({
            column: 6,
            line: 12,
            file: 'http://localhost:3000/__cypress/tests?p=cypress/e2e/spec.cy.js',
          }))
        })

        it('returns the original stack if it cannot be normalized for a test', () => {
          const stack = `Error
        at itGrep (http://localhost:3000/__cypress/tests?p=cypress/support/e2e.js:444:14)
        at context.notIt.only (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:98:46)
        at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)
        at itGrep.eval [as only] (cypress:///../driver/src/cypress/mocha.ts:187:14)
        at somethingElse (http://localhost:3000/__cypress/tests?p=cypress/e2e/spec.cy.js:12:6)`

          class MockError {
            get stack () {
              return stack
            }
          }

          const result = stack_utils.getInvocationDetails(
            { Error: MockError, Cypress: CypressWindow },
            config,
            'test',
          )

          expect(result.stack).toEqual(stack)
        })
      })

      describe('firefox', () => {
        beforeEach(() => {
          CypressWindow = {
            isBrowser: vi.fn(({ family }: Browser) => family === 'firefox') as any,
            testingType: 'e2e',
          }
        })

        it('returns the correct invocation details for a test stack trace that needs to be trimmed', () => {
          const stack = `myIt@http://localhost:3500/__cypress/tests?p=cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts:84:11
          @http://localhost:3500/__cypress/tests?p=cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts:87:9
          create@cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:141:19
          bddInterface/</context.context@cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:42:27`

          class MockError {
            get stack () {
              return stack
            }
          }

          stack_utils.getInvocationDetails(
            { Error: MockError, Cypress: CypressWindow },
            config,
            'test',
          )

          expect(source_map_utils.getSourcePosition).toHaveBeenCalledWith('http://localhost:3500/__cypress/tests?p=cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts', expect.objectContaining({
            column: 9,
            line: 87,
            file: 'http://localhost:3500/__cypress/tests?p=cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts',
          }))
        })

        it('returns the original stack if it cannot be normalized for a test', () => {
          // stack does not contain the invocation details that we're looking for, so we should return the original stack
          const stack = `myIt@http://localhost:3500/__cypress/tests?p=cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts:84:11
          create@cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:141:19
          bddInterface/</context.context@cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:42:27`

          class MockError {
            get stack () {
              return stack
            }
          }

          const result = stack_utils.getInvocationDetails(
            { Error: MockError, Cypress: CypressWindow },
            config,
            'test',
          )

          expect(result.stack).toEqual(stack)
        })
      })
    })
  })

  describe('normalizedUserInvocationStack', () => {
    it('should remove cross origin stack lines', () => {
      const userInvocationStack = `    at cy.<computed> [as prompt] (cypress:///../driver/src/cypress/cy.ts:657:86)
    at eval (eval at invokeOriginFn (cypress:///../driver/src/cross-origin/origin_fn.ts), <anonymous>:2:16)
    at invokeOriginFn (cypress:///../driver/src/cross-origin/origin_fn.ts:176:42)
    at SpecBridgeCommunicator.eval (cypress:///../driver/src/cross-origin/origin_fn.ts:180:21)`
      const normalizedUserInvocationStack = stack_utils.normalizedUserInvocationStack(userInvocationStack)

      expect(normalizedUserInvocationStack).toEqual(`    at eval (eval at invokeOriginFn (cypress:///../driver/src/cross-origin/origin_fn.ts), <anonymous>:2:16)`)
    })
  })

  describe('mergeCrossOriginUserInvocationStack', () => {
    it('should merge line numbers from origin stack into user stack', () => {
      const userInvocationStack = `    at eval (eval at invokeOriginFn (cypress:///../driver/src/cross-origin/origin_fn.ts), <anonymous>:2:16)`
      const originUserInvocationStack = `    at Context.eval (http://localhost:9500/__cypress/tests?p=cypress/e2e/run/cross-origin.cy.ts:14:12)`

      const result = stack_utils.mergeCrossOriginUserInvocationStack(userInvocationStack, originUserInvocationStack)

      // The first line should have line number 100 + 657 - 1 = 756, column should remain 86
      expect(result).toContain('    at Context.eval (http://localhost:9500/__cypress/tests?p=cypress/e2e/run/cross-origin.cy.ts:15:16)')
    })

    it('should handle different stack formats and preserve the rest of the stack', () => {
      const userInvocationStack = `    at cy.<computed> [as click] (cypress:///../driver/src/cypress/cy.ts:10:20)
    at eval (eval at invokeOriginFn (cypress:///../driver/src/cross-origin/origin_fn.ts), <anonymous>:2:16)
    at invokeOriginFn (cypress:///../driver/src/cross-origin/origin_fn.ts:176:42)
    at SpecBridgeCommunicator.eval (cypress:///../driver/src/cross-origin/origin_fn.ts:180:21)`

      const originUserInvocationStack = `    at cy.<computed> [as click] (cypress:///../driver/src/cypress/cy.ts:5:30)
    at eval (eval at invokeOriginFn (cypress:///../driver/src/cross-origin/origin_fn.ts), <anonymous>:1:10)`

      const result = stack_utils.mergeCrossOriginUserInvocationStack(userInvocationStack, originUserInvocationStack)

      // Line should be 5 + 10 - 1 = 14, column should remain 20
      expect(result).toContain('cypress:///../driver/src/cypress/cy.ts:14:20')
      // Rest of the stack should be preserved
      expect(result).toContain('at eval (eval at invokeOriginFn')
      expect(result).toContain('at invokeOriginFn')
      expect(result).toContain('at SpecBridgeCommunicator.eval')
    })

    it('should handle edge case where origin line is 1', () => {
      const userInvocationStack = `    at cy.<computed> [as click] (cypress:///../driver/src/cypress/cy.ts:3:15)
    at eval (eval at invokeOriginFn (cypress:///../driver/src/cross-origin/origin_fn.ts), <anonymous>:2:16)`

      const originUserInvocationStack = `    at cy.<computed> [as click] (cypress:///../driver/src/cypress/cy.ts:1:25)
    at eval (eval at invokeOriginFn (cypress:///../driver/src/cross-origin/origin_fn.ts), <anonymous>:1:10)`

      const result = stack_utils.mergeCrossOriginUserInvocationStack(userInvocationStack, originUserInvocationStack)

      // Line should be 1 + 3 - 1 = 3, column should remain 15
      expect(result).toContain('cypress:///../driver/src/cypress/cy.ts:3:15')
    })

    it('should handle edge case where user line is 1', () => {
      const userInvocationStack = `    at cy.<computed> [as click] (cypress:///../driver/src/cypress/cy.ts:1:15)
    at eval (eval at invokeOriginFn (cypress:///../driver/src/cross-origin/origin_fn.ts), <anonymous>:2:16)`

      const originUserInvocationStack = `    at cy.<computed> [as click] (cypress:///../driver/src/cypress/cy.ts:5:25)
    at eval (eval at invokeOriginFn (cypress:///../driver/src/cross-origin/origin_fn.ts), <anonymous>:1:10)`

      const result = stack_utils.mergeCrossOriginUserInvocationStack(userInvocationStack, originUserInvocationStack)

      // Line should be 5 + 1 - 1 = 5, column should remain 15
      expect(result).toContain('cypress:///../driver/src/cypress/cy.ts:5:15')
    })
  })
})
