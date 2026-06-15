/**
 * @vitest-environment jsdom
 */
import { vi, describe, it, expect, beforeEach } from 'vitest'

// source_map_utils must be included in order for vite to mock it, even
// if it isn't referenced.
// eslint-disable-next-line
import source_map_utils from '../../../src/cypress/source_map_utils'
import errUtils from '../../../src/cypress/error_utils'
import stackFrameFixture from './__fixtures__/getUserInvocationStack_stackFrames.json'

vi.mock('../../../src/cypress/source_map_utils', () => {
  return {
    default: {
      getSourcePosition: vi.fn(),
    },
  }
})

describe('err_utils', () => {
  beforeEach(() => {
    // @ts-expect-error
    global.Cypress = {
      config: vi.fn(),
    }

    vi.resetAllMocks()
  })

  describe('getUserInvocationStack', () => {
    const { invocationFile, line, column, scenarios } = stackFrameFixture

    let stack: string

    class MockError {
      name = 'CypressError'
      get userInvocationStack () {
        return stack
      }
    }

    const state = () => undefined

    for (const scenario of scenarios) {
      const { browser, build, testingType, stack: scenarioStack } = scenario

      describe(`${browser}:${build}:${testingType}`, () => {
        beforeEach(() => {
          stack = scenarioStack
        })

        it('returns the userInvocationStack with no leading internal cypress codeframes', () => {
          const invocationStack = errUtils.getUserInvocationStack(new MockError(), state)

          expect(invocationStack).not.toBeUndefined()

          const [first, second] = (invocationStack as string).split('\n')

          const invocationFrame = second ?? first

          expect(invocationFrame).toContain(`${invocationFile}:${line}:${column}`)
        })
      })
    }
  })

  describe('isSpecError', () => {
    const spec = { relative: 'cypress/e2e/foo.cy.ts' }

    it('returns true when the error stack contains the spec path', () => {
      const err = new Error('boom')

      err.stack = 'Error: boom\n    at fn (cypress/e2e/foo.cy.ts:1:1)'

      expect(errUtils.isSpecError(spec, err)).toBe(true)
    })

    it('returns false when the error stack does not contain the spec path', () => {
      const err = new Error('boom')

      err.stack = 'Error: boom\n    at fn (app.js:1:1)'

      expect(errUtils.isSpecError(spec, err)).toBe(false)
    })

    it('returns false when the spec path only appears as the runner URL file param', () => {
      // simulates a browser-generated error (e.g. ResizeObserver) in headless
      // mode whose synthesized "stack" is the runner URL embedding the spec path
      const err = new Error('ResizeObserver loop limit exceeded')

      err.stack = '  at <unknown> (http://localhost:3001/__/#/specs/runner?file=cypress/e2e/foo.cy.ts:0:0)'

      expect(errUtils.isSpecError(spec, err)).toBe(false)
    })

    it('still returns true for a genuine spec frame alongside the runner URL', () => {
      // a real async error thrown from spec code keeps the spec as a source
      // frame, so stripping the runner URL must not hide it
      const err = new Error('async spec boom')

      err.stack = [
        'Error: async spec boom',
        '    at fn (http://localhost:3001/__cypress/tests?p=cypress/e2e/foo.cy.ts:5:9)',
        '    at <unknown> (http://localhost:3001/__/#/specs/runner?file=cypress/e2e/foo.cy.ts:0:0)',
      ].join('\n')

      expect(errUtils.isSpecError(spec, err)).toBe(true)
    })

    it('returns false when there is no stack', () => {
      const err = new Error('boom')

      err.stack = undefined

      expect(errUtils.isSpecError(spec, err)).toBe(false)
    })
  })

  describe('errorFromUncaughtEvent', () => {
    it('synthesizes a non-spec error for a runner-URL error event without an error object', () => {
      // ResizeObserver loop errors fire an `error` event with no `error` object;
      // the synthesized stack is the runner URL embedding the spec path
      const { err } = errUtils.errorFromUncaughtEvent('error', {
        message: 'ResizeObserver loop limit exceeded',
        filename: 'http://localhost:3001/__/#/specs/runner?file=cypress/e2e/foo.cy.ts',
        lineno: 0,
        colno: 0,
        error: null,
      }) as { err: Error }

      expect(errUtils.isSpecError({ relative: 'cypress/e2e/foo.cy.ts' }, err)).toBe(false)
    })

    it('treats errors that carry a real error object with a spec frame as spec errors', () => {
      const realError = new Error('real boom')

      realError.stack = 'Error: real boom\n    at fn (cypress/e2e/foo.cy.ts:1:1)'

      const { err } = errUtils.errorFromUncaughtEvent('error', {
        message: 'real boom',
        error: realError,
      }) as { err: Error }

      expect(errUtils.isSpecError({ relative: 'cypress/e2e/foo.cy.ts' }, err)).toBe(true)
    })
  })
})
