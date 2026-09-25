// Intentionally omit spec_helper: it pulls in lib/cache before this file's imports; that chain
// fails under some Node/ts-node setups. Chai's `expect` is sufficient for this pure unit test.
import { expect } from 'chai'
import { EventEmitter } from 'events'

import type { ReporterResults } from '../../../lib/types/reporter'
import { EarlyExitTerminator, patchRunResultsAfterCrash } from '../../../lib/util/graceful_crash_handling'

const baseReporterResults = (): ReporterResults => {
  return {
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
  }
}

describe('lib/util/graceful_crash_handling', () => {
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

      expect(test.attempts[0].error.stack).to.eq(`    at cfg (cypress.config.js:1:1)`)
    })

    it('serializes attempt stack without message line (matches reporter normalizeTest)', () => {
      const err = new Error('config blew up')

      err.stack = `Error: config blew up\n    at foo (bar.js:1:1)`

      const out = patchRunResultsAfterCrash(err, baseReporterResults(), { id: 'r1' })
      const attemptErr = out.tests[0].attempts[0].error

      expect(attemptErr?.name).to.eq('Error')
      expect(attemptErr?.message).to.eq('config blew up')
      expect(attemptErr?.stack).to.eq(`    at foo (bar.js:1:1)`)
    })

    it('strips ANSI from displayError and attempt fields for Cypress errors', () => {
      const fatal = new Error(
        'Your \u001b[33mconfigFile\u001b[39m threw an error from: \u001b[94mcypress.config.js\u001b[39m\n\nWe stopped running your tests because your config file crashed.',
      )

      fatal.stack = `${fatal.message}\n    at x (y:1:1)`

      const out = patchRunResultsAfterCrash(fatal, baseReporterResults(), { id: 'r1' })

      expect(out.tests[0].displayError).to.not.include('\u001b[')
      expect(out.tests[0].attempts[0].error?.message).to.not.include('\u001b[')
      expect(out.tests[0].attempts[0].error?.message).to.include('configFile')
      expect(out.tests[0].attempts[0].error?.message).to.include('cypress.config.js')
      expect(out.tests[0].attempts[0].error?.stack).to.not.include('\u001b[')
    })

    it('includes the message in displayError when the stack does not contain it', () => {
      const fatal = new Error('We detected that the Chrome browser stopped responding.')

      // errors.get() captures the stack from a separate, empty Error
      fatal.stack = 'Error: \n    at ActivityMonitor.onInactivity (run.ts:1:1)'

      const out = patchRunResultsAfterCrash(fatal, baseReporterResults(), { id: 'r1' })

      expect(out.tests[0].displayError).to.eq([
        'Error: We detected that the Chrome browser stopped responding.',
        '    at ActivityMonitor.onInactivity (run.ts:1:1)',
      ].join('\n'))
    })

    it('does not throw and does not patch tests when mostRecentRunnable is undefined', () => {
      const fatal = new Error('boom')
      const results = baseReporterResults()
      const out = patchRunResultsAfterCrash(fatal, results, undefined)

      expect(out.tests[0].state).to.eq('skipped')
      expect(out.tests[0].attempts[0].error).to.eq(null)
    })

    it('does not patch test when runnable id does not match a test (stats still reflect fatal)', () => {
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
      expect(out.tests[0].attempts[0].error).to.eq(null)
      expect(out.tests[1].state).to.eq('passed')
      expect(out.tests[1].attempts[0].error).to.eq(null)
      expect(out.stats.failures).to.equal(results.stats.failures + 1)
    })

    it('only replaces the last attempt when there are prior attempts (retries)', () => {
      const fatal = new Error('tab crashed')
      const results = baseReporterResults()

      results.tests[0].attempts = [
        {
          state: 'failed',
          error: { name: 'Error', message: 'first flake', stack: 'at a' },
          timings: null,
          failedFromHookId: null,
          wallClockStartedAt: new Date(0),
          wallClockDuration: 1,
          videoTimestamp: null,
        },
        {
          state: 'skipped',
          error: null,
          timings: null,
          failedFromHookId: null,
          wallClockStartedAt: new Date(1),
          wallClockDuration: 0,
          videoTimestamp: null,
        },
      ]

      const out = patchRunResultsAfterCrash(fatal, results, { id: 'r1' })

      expect(out.tests[0].attempts).to.have.length(2)
      expect(out.tests[0].attempts[0].error).to.deep.include({ message: 'first flake' })
      expect(out.tests[0].attempts[1].state).to.eq('failed')
      expect(out.tests[0].attempts[1].error?.message).to.eq('tab crashed')
    })

    describe('tests skipped after the crashed test', () => {
      const withTests = (...tests: Array<{ testId: string, title: string[], state: string }>): ReporterResults => {
        const results = baseReporterResults()
        const template = results.tests[0]

        results.tests = tests.map((test) => ({ ...template, ...test }))

        return results
      }

      it('sets displayError naming the crashed test and the first line of the error', () => {
        const fatal = new Error('We detected that the Chrome browser stopped responding.\n\nMore detail')

        const out = patchRunResultsAfterCrash(fatal, withTests(
          { testId: 'r1', title: ['Suite', 'hangs'], state: 'skipped' },
          { testId: 'r2', title: ['Suite', 'after'], state: 'skipped' },
        ), { id: 'r1' })

        expect(out.tests[1].state).to.eq('skipped')
        expect(out.tests[1].displayError).to.eq([
          'This test did not run because the spec ended early during "Suite > hangs":',
          '',
          'We detected that the Chrome browser stopped responding.',
        ].join('\n'))
      })

      it('does not set displayError on tests before the crashed test or on pending tests', () => {
        const out = patchRunResultsAfterCrash(new Error('crashed'), withTests(
          { testId: 'r1', title: ['Suite', 'skipped by hook'], state: 'skipped' },
          { testId: 'r2', title: ['Suite', 'hangs'], state: 'skipped' },
          { testId: 'r3', title: ['Suite', 'it.skip'], state: 'pending' },
        ), { id: 'r2' })

        expect(out.tests[0].displayError).to.be.null
        expect(out.tests[2].displayError).to.be.null
      })

      it('does not set displayError when the crashed test is unknown', () => {
        const out = patchRunResultsAfterCrash(new Error('crashed'), withTests(
          { testId: 'r1', title: ['Suite', 'a'], state: 'skipped' },
        ), { id: 'nope' })

        expect(out.tests[0].displayError).to.be.null
      })
    })
  })

  describe('EarlyExitTerminator#pendingTestTitle', () => {
    const startTerminator = () => {
      const project = new EventEmitter()
      const terminator = new EarlyExitTerminator()

      terminator.waitForEarlyExit(project as any)

      return { project, terminator }
    }

    it('is undefined before any test has started', () => {
      const { terminator } = startTerminator()

      expect(terminator.pendingTestTitle).to.be.undefined
    })

    it('joins the reporter title path of the running test', () => {
      const { project, terminator } = startTerminator()

      project.emit('test:before:run', {
        runnable: { id: 'r1', title: 'fails on crash' },
        previousResults: baseReporterResults(),
      })

      expect(terminator.pendingTestTitle).to.eq('Suite > fails on crash')
    })

    it('falls back to the runnable title when the reporter has no matching test', () => {
      const { project, terminator } = startTerminator()

      project.emit('test:before:run', {
        runnable: { id: 'r2', title: 'not reported yet' },
        previousResults: baseReporterResults(),
      })

      expect(terminator.pendingTestTitle).to.eq('not reported yet')
    })
  })
})
