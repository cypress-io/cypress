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
})
