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

  describe('logError', () => {
    const createCypress = (runnableId: string | undefined = 'r1', retry = 0) => {
      const log = { set: vi.fn() }

      return {
        cypress: {
          log: vi.fn().mockReturnValue(log),
          state: vi.fn((key: string) => (key === 'runnable' ? { id: runnableId, type: 'test', _currentRetry: retry } : undefined)),
        },
        log,
      }
    }

    beforeEach(() => {
      errUtils.resetUncaughtErrorLogState()
    })

    it('takes a DOM snapshot for an unhandled uncaught exception', () => {
      const { cypress } = createCypress('snapshot-unhandled')

      errUtils.logError(cypress, 'error', new Error('boom'), false)

      expect(cypress.log).toHaveBeenCalledTimes(1)
      expect(cypress.log.mock.calls[0][0]).toMatchObject({
        name: 'uncaught exception',
        snapshot: true,
        error: expect.any(Error),
      })
    })

    it('does NOT snapshot a handled (suppressed) uncaught exception', () => {
      const { cypress } = createCypress('snapshot-handled')

      errUtils.logError(cypress, 'error', new Error('boom'), true)

      expect(cypress.log).toHaveBeenCalledTimes(1)
      expect(cypress.log.mock.calls[0][0]).toMatchObject({
        name: 'uncaught exception',
        snapshot: false,
        // handled errors omit the error so the log renders grey/passed
        error: undefined,
      })
    })

    it('collapses consecutive identical uncaught exceptions into one updating log', () => {
      const { cypress, log } = createCypress('dedupe-collapse')
      const err = () => new Error('ResizeObserver loop completed with undelivered notifications.')

      errUtils.logError(cypress, 'error', err(), true)
      errUtils.logError(cypress, 'error', err(), true)
      errUtils.logError(cypress, 'error', err(), true)

      // only the first occurrence creates a log; the rest update it in place
      expect(cypress.log).toHaveBeenCalledTimes(1)
      expect(log.set).toHaveBeenCalledTimes(2)
    })

    it('updates the deduped log message with the occurrence count', () => {
      const { cypress, log } = createCypress('dedupe-count')
      const err = () => new Error('ResizeObserver loop completed with undelivered notifications.')

      errUtils.logError(cypress, 'error', err(), true)
      errUtils.logError(cypress, 'error', err(), true)

      expect(log.set).toHaveBeenCalledWith({
        message: 'Error: ResizeObserver loop completed with undelivered notifications. (2)',
      })
    })

    it('creates a new log when the message differs', () => {
      const { cypress } = createCypress('message-differs')

      errUtils.logError(cypress, 'error', new Error('first'), true)
      errUtils.logError(cypress, 'error', new Error('second'), true)

      expect(cypress.log).toHaveBeenCalledTimes(2)
    })

    it('does NOT dedupe identical messages across different runnables', () => {
      const first = createCypress('r1')
      const second = createCypress('r2')
      const err = () => new Error('same message')

      errUtils.logError(first.cypress, 'error', err(), true)
      errUtils.logError(second.cypress, 'error', err(), true)

      expect(first.cypress.log).toHaveBeenCalledTimes(1)
      expect(second.cypress.log).toHaveBeenCalledTimes(1)
      expect(first.log.set).not.toHaveBeenCalled()
      expect(second.log.set).not.toHaveBeenCalled()
    })

    it('does NOT dedupe identical messages across test retries', () => {
      const firstAttempt = createCypress('retry-test', 0)
      const secondAttempt = createCypress('retry-test', 1)
      const err = () => new Error('same message')

      errUtils.logError(firstAttempt.cypress, 'error', err(), true)
      errUtils.logError(secondAttempt.cypress, 'error', err(), true)

      expect(firstAttempt.cypress.log).toHaveBeenCalledTimes(1)
      expect(secondAttempt.cypress.log).toHaveBeenCalledTimes(1)
      expect(firstAttempt.log.set).not.toHaveBeenCalled()
      expect(secondAttempt.log.set).not.toHaveBeenCalled()
    })

    it('creates a new failing log when a suppressed error becomes unhandled', () => {
      const { cypress, log } = createCypress('handled-to-unhandled')
      const err = new Error('same message')

      errUtils.logError(cypress, 'error', err, true)
      errUtils.logError(cypress, 'error', err, false)

      expect(cypress.log).toHaveBeenCalledTimes(2)
      expect(cypress.log.mock.calls[1][0]).toMatchObject({
        name: 'uncaught exception',
        snapshot: true,
        error: err,
      })

      expect(log.set).not.toHaveBeenCalled()
    })

    it('clears dedup state on resetUncaughtErrorLogState', () => {
      const { cypress, log } = createCypress('reset-dedup')
      const err = () => new Error('same message')

      errUtils.logError(cypress, 'error', err(), true)
      errUtils.logError(cypress, 'error', err(), true)
      errUtils.resetUncaughtErrorLogState()
      errUtils.logError(cypress, 'error', err(), true)
      errUtils.logError(cypress, 'error', err(), true)

      expect(cypress.log).toHaveBeenCalledTimes(2)
      expect(log.set).toHaveBeenCalledTimes(2)
    })
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
})
