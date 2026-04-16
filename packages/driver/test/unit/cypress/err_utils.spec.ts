/**
 * @vitest-environment jsdom
 */
import { vi, describe, it, expect, beforeEach } from 'vitest'
import chai from 'chai'

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

  describe('wrapErr', () => {
    const { truncateThreshold: threshold } = chai.config
    const baseErr = {
      message: 'expected values to be equal',
      name: 'AssertionError',
      showDiff: true,
    }

    const makeWrapped = (actual: unknown, expected: unknown) => {
      return errUtils.wrapErr({ ...baseErr, actual, expected })
    }

    const makeExpected = (actual: unknown, expected: unknown) => {
      return { ...baseErr, actual, expected }
    }

    it('should return non-string values unchanged', () => {
      const wrapped = makeWrapped({ a: 1 }, { a: 2 })

      expect(wrapped).to.deep.eq(
        makeExpected('{ a: 1 }', '{ a: 2 }'),
      )
    })

    it('should return identical strings unchanged', () => {
      const value = 'identical'
      const wrapped = makeWrapped(value, value)

      expect(wrapped).to.deep.eq(
        makeExpected('\'identical\'', '\'identical\''),
      )
    })

    it('should return short strings unchanged', () => {
      const actual = 'short-X'
      const expected = 'short-Y'
      const wrapped = makeWrapped(actual, expected)

      expect(wrapped).to.deep.eq(
        makeExpected('\'short-X\'', '\'short-Y\''),
      )
    })

    it('should truncate long strings around the diff with both markers', () => {
      const samePrefix = 'a'.repeat(threshold + 10)
      const actual = `${samePrefix}X${'b'.repeat(50)}`
      const expected = `${samePrefix}Y${'b'.repeat(50)}`
      const wrapped = makeWrapped(actual, expected)

      expect(wrapped).to.deep.eq(
        makeExpected(
          '\'…aaaaaaaaaaaaaaaaaaaXbbbbbbbbbbbbbbbbbb…\'',
          '\'…aaaaaaaaaaaaaaaaaaaYbbbbbbbbbbbbbbbbbb…\'',
        ),
      )
    })

    it('should omit leading marker when difference is near the start', () => {
      const actual = `X${'a'.repeat(threshold + 10)}`
      const expected = `Y${'a'.repeat(threshold + 10)}`
      const wrapped = makeWrapped(actual, expected)

      expect(wrapped).to.deep.eq(
        makeExpected(
          '\'Xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa…\'',
          '\'Yaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa…\'',
        ),
      )
    })

    it('should omit trailing marker when difference is near the end', () => {
      const actual = `${'a'.repeat(threshold + 10)}X`
      const expected = `${'a'.repeat(threshold + 10)}Y`
      const wrapped = makeWrapped(actual, expected)

      expect(wrapped).to.deep.eq(
        makeExpected(
          '\'…aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaX\'',
          '\'…aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaY\'',
        ),
      )
    })
  })
})
