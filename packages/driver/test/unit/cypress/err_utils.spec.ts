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

  describe('isBenignResizeObserverError', () => {
    it('matches the modern Chromium ResizeObserver loop message', () => {
      expect(errUtils.isBenignResizeObserverError({
        message: 'ResizeObserver loop completed with undelivered notifications.',
      })).toBe(true)
    })

    it('matches the legacy ResizeObserver loop message', () => {
      expect(errUtils.isBenignResizeObserverError({
        message: 'ResizeObserver loop limit exceeded',
      })).toBe(true)
    })

    it('does not match unrelated errors', () => {
      expect(errUtils.isBenignResizeObserverError({
        message: 'TypeError: foo is not a function',
      })).toBe(false)
    })

    it('does not match when ResizeObserver text is not at the start of the message', () => {
      expect(errUtils.isBenignResizeObserverError({
        message: 'Custom error mentioning ResizeObserver loop completed with undelivered notifications.',
      })).toBe(false)
    })

    it('handles missing or non-error values without throwing', () => {
      expect(errUtils.isBenignResizeObserverError(undefined)).toBe(false)
      expect(errUtils.isBenignResizeObserverError(null)).toBe(false)
      expect(errUtils.isBenignResizeObserverError('ResizeObserver loop limit exceeded')).toBe(false)
      expect(errUtils.isBenignResizeObserverError({})).toBe(false)
    })
  })
})
