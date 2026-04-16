// Intentionally omit spec_helper: it pulls in lib/cache before this file's imports; that chain
// fails under some Node/ts-node setups. Chai's `expect` is sufficient for this pure unit test.
import { expect } from 'chai'

import type { ReporterResults } from '../../../lib/types/reporter'
import {
  fatalErrorToAttemptError,
  patchRunResultsAfterCrash,
} from '../../../lib/util/graceful_crash_handling'

const baseReporterResults = (): ReporterResults => ({
  reporter: 'spec',
  reporterStats: {
    suites: 1,
    tests: 1,
    passes: 0,
    pending: 0,
    failures: 0,
    start: new Date(0).toJSON(),
    end: new Date(0).toJSON(),
    duration: 0,
  },
  hooks: [],
  stats: {
    failures: 0,
    tests: 1,
    passes: 0,
    pending: 0,
    suites: 1,
    skipped: 1,
    wallClockDuration: 0,
    wallClockStartedAt: new Date(0).toJSON(),
    wallClockEndedAt: new Date(0).toJSON(),
  },
  tests: [
    {
      testId: 'r1',
      title: ['Suite', 'fails on crash'],
      state: 'skipped',
      body: '',
      displayError: null,
      attempts: [{
        state: 'skipped',
        error: null,
        timings: null,
        failedFromHookId: null,
        wallClockStartedAt: new Date(0),
        wallClockDuration: 0,
        videoTimestamp: null,
      }],
    },
  ],
})

describe('lib/util/graceful_crash_handling', () => {
  describe('fatalErrorToAttemptError', () => {
    it('serializes name, message, and stack without message line', () => {
      const err = new Error('config blew up')

      err.stack = `Error: config blew up\n    at foo (bar.js:1:1)`

      const serialized = fatalErrorToAttemptError(err)

      expect(serialized.name).to.eq('Error')
      expect(serialized.message).to.eq('config blew up')
      expect(serialized.stack).to.eq(`    at foo (bar.js:1:1)`)
    })
  })

  describe('patchRunResultsAfterCrash', () => {
    it('sets last attempt error and displayError when runnable id matches', () => {
      const fatal = new Error('Your configFile threw an error')

      fatal.stack = `Error: Your configFile threw an error\n    at cfg (cypress.config.js:1:1)`

      const out = patchRunResultsAfterCrash(fatal, baseReporterResults(), { id: 'r1' })

      expect(out.error).to.include('Your configFile threw an error')

      const test = out.tests[0]

      expect(test.state).to.eq('failed')
      expect(test.displayError).to.eq(fatal.stack)
      expect(test.attempts).to.have.length(1)
      expect(test.attempts[0].state).to.eq('failed')
      expect(test.attempts[0].error).to.include({
        name: 'Error',
        message: 'Your configFile threw an error',
      })

      expect(test.attempts[0].error.stack).to.include('cypress.config.js')
    })

    it('falls back to the last test when runnable id does not match any test', () => {
      const fatal = new Error('config process died')
      const results = baseReporterResults()

      results.tests.push({
        testId: 'r2',
        title: ['Suite', 'other'],
        state: 'passed',
        body: '',
        displayError: null,
        attempts: [{
          state: 'passed',
          error: null,
          timings: null,
          failedFromHookId: null,
          wallClockStartedAt: new Date(0),
          wallClockDuration: 1,
          videoTimestamp: null,
        }],
      })

      const out = patchRunResultsAfterCrash(fatal, results, { id: 'nonexistent' })

      expect(out.tests[0].state).to.eq('skipped')
      expect(out.tests[1].state).to.eq('failed')
      expect(out.tests[1].attempts[0].error?.message).to.eq('config process died')
    })

    it('creates a single failed attempt when the target test has no attempts yet', () => {
      const fatal = new Error('early crash')
      const results = baseReporterResults()

      results.tests[0].attempts = []

      const out = patchRunResultsAfterCrash(fatal, results, { id: 'r1' })

      expect(out.tests[0].attempts).to.have.length(1)
      expect(out.tests[0].attempts[0].state).to.eq('failed')
      expect(out.tests[0].attempts[0].error?.message).to.eq('early crash')
    })
  })
})
