import '../../spec_helper'

import {
  createPublicRun,
  toLeanRunResult,
} from '../../../lib/modes/results'

// A representative full per-spec RunResult, including the heavy fields
// (test/hook bodies, per-attempt error stacks + code frames, timings) that
// `toLeanRunResult` is responsible for trimming once per-spec reporting is done.
const makeFullRunResult = () => ({
  error: null,
  reporter: 'spec',
  reporterStats: {
    suites: 1,
    tests: 2,
    passes: 1,
    pending: 0,
    failures: 1,
    start: '2020-01-01T00:00:00.000Z',
    end: '2020-01-01T00:00:05.000Z',
    duration: 5000,
  },
  hooks: [
    {
      hookName: 'beforeEach' as const,
      title: ['"before each" hook'],
      body: 'function () { doExpensiveSetup() }',
    },
  ],
  screenshots: [
    {
      screenshotId: 'abc123',
      name: null,
      testId: 'r3',
      testAttemptIndex: 1,
      takenAt: '2020-01-01T00:00:03.000Z',
      path: '/path/to/screenshot.png',
      height: 720,
      width: 1280,
      pathname: undefined,
    },
  ],
  skippedSpec: false,
  spec: {
    absolute: '/path/to/cypress/e2e/spec.cy.ts',
    fileExtension: '.ts',
    fileName: 'spec',
    name: 'cypress/e2e/spec.cy.ts',
    relative: 'cypress/e2e/spec.cy.ts',
    relativeToCommonRoot: 'spec.cy.ts',
  },
  stats: {
    suites: 1,
    tests: 2,
    passes: 1,
    pending: 0,
    skipped: 0,
    failures: 1,
    wallClockDuration: 5000,
    wallClockStartedAt: '2020-01-01T00:00:00.000Z',
    wallClockEndedAt: '2020-01-01T00:00:05.000Z',
  },
  tests: [
    {
      title: ['suite', 'passes'],
      state: 'passed',
      body: 'function () { expect(true).to.be.true }',
      displayError: null,
      attempts: [
        {
          state: 'passed',
          error: null,
          timings: { lifecycle: 12, test: { afterFnDuration: 1, fnDuration: 30 } },
          failedFromHookId: null,
          wallClockStartedAt: '2020-01-01T00:00:00.000Z',
          wallClockDuration: 2000,
          videoTimestamp: 1000,
        },
      ],
    },
    {
      title: ['suite', 'fails'],
      state: 'failed',
      body: 'function () { expect(true).to.be.false }',
      displayError: 'AssertionError: expected true to be false\n    at spec.cy.ts:7:8',
      attempts: [
        {
          state: 'failed',
          error: {
            name: 'AssertionError',
            message: 'expected true to be false',
            stack: 'AssertionError: expected true to be false\n    at spec.cy.ts:7:8',
            codeFrame: {
              line: 7,
              column: 8,
              frame: '  5 |\n  6 | it(\'fails\')\n> 7 |   expect(true).to.be.false\n    |        ^',
              language: 'js',
            },
          },
          timings: { lifecycle: 8, test: { afterFnDuration: 2, fnDuration: 100 } },
          failedFromHookId: null,
          wallClockStartedAt: '2020-01-01T00:00:02.000Z',
          wallClockDuration: 3000,
          videoTimestamp: 3000,
        },
      ],
    },
  ],
  video: '/path/to/video.mp4',
})

describe('lib/modes/results', () => {
  context('toLeanRunResult', () => {
    it('produces the same public run result as the full result', () => {
      const full = makeFullRunResult() as any

      // The whole point: trimming must be invisible to the public Module API
      // result, the JSON report, and the after:run payload.
      expect(createPublicRun(toLeanRunResult(full))).to.deep.equal(createPublicRun(full))
    })

    it('preserves the fields the end-of-run aggregate and summary table read', () => {
      const full = makeFullRunResult() as any
      const lean = toLeanRunResult(full)

      expect(lean.stats).to.deep.equal(full.stats)
      expect(lean.skippedSpec).to.equal(full.skippedSpec)
      expect(lean.spec).to.deep.equal(full.spec)
      expect(lean.error).to.equal(full.error)
      expect(lean.reporter).to.equal(full.reporter)
      expect(lean.reporterStats).to.deep.equal(full.reporterStats)
      expect(lean.video).to.equal(full.video)
      expect(lean.screenshots).to.deep.equal(full.screenshots)
    })

    it('frees the heavy per-spec payload', () => {
      const lean = toLeanRunResult(makeFullRunResult() as any)

      // hooks are not part of the public result and are dropped entirely
      expect(lean.hooks).to.deep.equal([])

      lean.tests.forEach((test) => {
        // test bodies are not read after per-spec reporting
        expect(test.body).to.equal('')

        test.attempts.forEach((attempt) => {
          // error stacks/code frames and timings are dropped
          expect(attempt.error).to.be.null
          expect(attempt.timings).to.be.null
          expect(attempt.videoTimestamp).to.be.null
          expect(attempt.wallClockStartedAt).to.be.null
          expect(attempt.failedFromHookId).to.be.null
        })
      })
    })

    it('only retains attempt state and wallClockDuration', () => {
      const lean = toLeanRunResult(makeFullRunResult() as any)

      expect(lean.tests[0].state).to.equal('passed')
      expect(lean.tests[0].attempts[0].state).to.equal('passed')
      expect(lean.tests[0].attempts[0].wallClockDuration).to.equal(2000)
      expect(lean.tests[1].attempts[0].state).to.equal('failed')
      expect(lean.tests[1].attempts[0].wallClockDuration).to.equal(3000)
      // displayError survives because the public result exposes it
      expect(lean.tests[1].displayError).to.equal(makeFullRunResult().tests[1].displayError)
    })

    it('handles a result with no tests (e.g. an interrupted spec)', () => {
      const lean = toLeanRunResult({ stats: { failures: 0 }, tests: null } as any)

      expect(lean.tests).to.deep.equal([])
      expect(lean.hooks).to.deep.equal([])
    })
  })
})
