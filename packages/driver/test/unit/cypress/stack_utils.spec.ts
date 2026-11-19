/**
 * @vitest-environment jsdom
 */
import { vi, describe, it, expect, beforeEach } from 'vitest'

import source_map_utils from '../../../src/cypress/source_map_utils'
import stack_utils from '../../../src/cypress/stack_utils'
import stackFrameFixture from './__fixtures__/getInvocationDetails_spec_stackframes.json'
import type { Browser } from '@packages/types'

vi.mock('../../../src/cypress/source_map_utils', () => {
  return {
    default: {
      getSourcePosition: vi.fn(),
    },
  }
})

describe('stack_utils', () => {
  beforeEach(() => {
    // @ts-expect-error - partial Cypress mock
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

          if (!result) throw new Error('expected invocation details')

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

          if (!result) throw new Error('expected invocation details')

          expect(result.stack).toEqual(stack)
        })
      })
    })
  })

  describe('normalizedStack', () => {
    describe('webkit', () => {
      beforeEach(() => {
        vi.mocked(Cypress.isBrowser).mockImplementation((browser) => browser === 'webkit')
      })

      const normalize = (message: string, stack: string) => {
        const err = new Error(message)

        err.stack = stack

        return stack_utils.normalizedStack(err)
      }

      it('fills in missing function names and locations', () => {
        expect(normalize('boom', 'foo@http://localhost/a.js:1:2\n@http://localhost/a.js:3:4\nglobal code@\nmap@[native code]')).toEqual(
          'Error: boom\nfoo@http://localhost/a.js:1:2\n<unknown>@http://localhost/a.js:3:4\nglobal code@<unknown>\nmap@[native code]',
        )
      })

      it('removes the CyWebKitError line', () => {
        expect(normalize('boom', '__CyWebKitError@http://localhost/a.js:1:2\nfoo@http://localhost/a.js:3:4')).toEqual(
          'Error: boom\nfoo@http://localhost/a.js:3:4',
        )
      })

      it('splits a line at its last @', () => {
        expect(normalize('boom', 'foo@bar@')).toEqual(
          'Error: boom\nfoo@bar@<unknown>',
        )
      })

      it('normalizes a stack with a very long message line in linear time', () => {
        const message = `expected <body> to contain text 'Noted.', but the text was '${'word '.repeat(30000)}'`
        const stack = `Error: ${message}\nfoo@http://localhost/a.js:1:2`

        const start = performance.now()

        expect(normalize(message, stack)).toEqual(stack)
        expect(performance.now() - start).toBeLessThan(1000)
      })
    })
  })

  describe('getSourceStack', () => {
    const location = 'http://localhost:8080/__cypress/cypress/spec.cy.js:14:16'

    const expectFunctionName = (functionName: string, expected: string) => {
      const { parsed, sourceMapped } = stack_utils.getSourceStack(`${functionName}@${location}`)

      expect(parsed?.[0]).toHaveProperty('function', expected)
      expect(sourceMapped).toBe(`at ${expected} (${location})`)
    }

    // names from the Firefox stacks in __fixtures__
    it.each([
      ['onRunnableRun/<', 'onRunnableRun'],
      ['./cypress/spec.cy.js/</<', './cypress/spec.cy.js'],
      ['__webpack_modules__</create/onRunnableRun/<', '__webpack_modules__</create/onRunnableRun'],
      ['__webpack_modules__</bddInterface/</context.context', '__webpack_modules__</bddInterface/</context.context'],
      ['__webpack_modules__</module.exports/Promise.prototype._resolveFromExecutor/r<', '__webpack_modules__</module.exports/Promise.prototype._resolveFromExecutor/r<'],
      ['__stackReplacementMarker', '__stackReplacementMarker'],
      ['', '<unknown>'],
    ])('names the captured Firefox frame %j as %j', expectFunctionName)

    // forms that follow Firefox's naming rules but are not in the captured stacks
    it.each([
      ['./cypress/spec.cy.js/</</<', './cypress/spec.cy.js'],
      ['onRunnableRun</<', 'onRunnableRun'],
      ['onRunnableRun</</<', 'onRunnableRun'],
      ['/<', '<unknown>'],
      ['/</<', '<unknown>'],
    ])('names the extrapolated Firefox frame %j as %j', expectFunctionName)

    it('names a Chromium frame without Firefox markers', () => {
      const { parsed } = stack_utils.getSourceStack(`    at Context.eval (${location})`)

      expect(parsed?.[0]).toHaveProperty('function', 'Context.eval')
    })

    it('names a Firefox frame with a long run of markers in linear time', () => {
      const markers = '/<'.repeat(100000)
      // a run of markers that does not end the name is the input that makes
      // a backtracking match quadratic
      const stack = [`${markers}onRunnableRun@${location}`, `./cypress/spec.cy.js${markers}@${location}`].join('\n')

      const start = performance.now()
      const { parsed } = stack_utils.getSourceStack(stack)

      expect(performance.now() - start).toBeLessThan(1000)
      expect(parsed?.[0]).toHaveProperty('function', `${markers}onRunnableRun`)
      expect(parsed?.[1]).toHaveProperty('function', './cypress/spec.cy.js')
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

    it('merges line numbers from a Firefox stack, whose lines do not end in a parenthesis', () => {
      const userInvocationStack = 'eval@http://localhost:3500/__cypress/spec-bridge.js:2:16'
      const originUserInvocationStack = 'Context.eval@http://localhost:9500/__cypress/tests?p=cypress/e2e/run/cross-origin.cy.ts:14:12'

      const result = stack_utils.mergeCrossOriginUserInvocationStack(userInvocationStack, originUserInvocationStack)

      expect(result).toBe('Context.eval@http://localhost:9500/__cypress/tests?p=cypress/e2e/run/cross-origin.cy.ts:15:16')
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
