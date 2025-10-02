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
