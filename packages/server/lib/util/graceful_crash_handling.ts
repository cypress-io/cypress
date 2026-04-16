import type { ProjectBase } from '../project-base'
import type { BaseReporterResults, ReporterResults } from '../types/reporter'
import { log, stackUtils, stripAnsi } from '@packages/errors'
import Debug from 'debug'
import pDefer, { DeferredPromise } from 'p-defer'

const debug = Debug('cypress:util:crash_handling')

/** Matches attempt `error` shape from `reporter.js` `normalizeTest` for Cypress Cloud. */
export const fatalErrorToAttemptError = (error: Error) => {
  const codeFrame = (error as { codeFrame?: unknown }).codeFrame
  const stackLines = error.stack ? stackUtils.stackWithoutMessage(error.stack) : undefined

  return {
    name: error.name,
    message: stripAnsi(error.message),
    stack: stackLines !== undefined ? stripAnsi(stackLines) : undefined,
    ...(codeFrame !== undefined ? { codeFrame } : {}),
  }
}

export const patchRunResultsAfterCrash = (
  error: Error,
  reporterResults: ReporterResults,
  mostRecentRunnable: { id?: string } | undefined,
): ReporterResults => {
  const endTime: number = reporterResults?.stats?.wallClockEndedAt ? Date.parse(reporterResults?.stats?.wallClockEndedAt) : new Date().getTime()
  const wallClockDuration = reporterResults?.stats?.wallClockStartedAt ?
    endTime - Date.parse(reporterResults.stats.wallClockStartedAt) : 0
  const endTimeStamp = new Date(endTime).toJSON()

  // in crash situations, the most recent report will not have the triggering test
  // so the results are manually patched, which produces the expected exit=1 and
  // terminal output indicating the failed test. Per-attempt `error` + `displayError`
  // are set so Cypress Cloud can show the fatal/config message on the impacted test.
  return {
    ...reporterResults,
    stats: {
      ...reporterResults?.stats,
      wallClockEndedAt: endTimeStamp,
      wallClockDuration,
      failures: (reporterResults?.stats?.failures ?? 0) + 1,
      skipped: (reporterResults?.stats?.skipped ?? 1) - 1,
    },
    reporterStats: {
      ...reporterResults?.reporterStats,
      tests: (reporterResults?.reporterStats?.tests ?? 0) + 1, // crashed test does not increment this value
      end: reporterResults?.reporterStats?.end || endTimeStamp,
      duration: wallClockDuration,
      failures: (reporterResults?.reporterStats?.failures ?? 0) + 1,
    },
    tests: (reporterResults?.tests || []).map((test) => {
      if (test.testId === mostRecentRunnable?.id) {
        const prevAttempts = test.attempts.slice(0, -1)
        const lastAttempt = test.attempts[test.attempts.length - 1]
        const attemptError = fatalErrorToAttemptError(error)

        return {
          ...test,
          state: 'failed',
          displayError: stripAnsi(error.stack || error.message),
          attempts: [...prevAttempts, {
            ...lastAttempt,
            state: 'failed',
            error: attemptError,
          }],
        }
      }

      return test
    }),
    error: stripAnsi(error.message),
  }
}

const defaultStats = (error: Error): BaseReporterResults => {
  return {
    error: stripAnsi(error.message),
    stats: {
      failures: 1,
      tests: 0,
      passes: 0,
      pending: 0,
      suites: 0,
      skipped: 0,
      wallClockDuration: 0,
      wallClockStartedAt: new Date().toJSON(),
      wallClockEndedAt: new Date().toJSON(),
    },
  }
}

export class EarlyExitTerminator {
  private terminator: DeferredPromise<BaseReporterResults>

  private pendingRunnable: any
  private intermediateStats: ReporterResults | undefined

  constructor () {
    this.terminator = pDefer<BaseReporterResults>()
  }

  waitForEarlyExit (project: ProjectBase) {
    debug('waiting for early exit')

    project.on('test:before:run', ({
      runnable,
      previousResults,
    }) => {
      debug('preparing to run test, previous stats reported as %o', previousResults)

      this.intermediateStats = previousResults
      this.pendingRunnable = runnable
    })

    return this.terminator.promise
  }

  exitEarly (error) {
    if (error.isFatalApiErr) {
      this.terminator.reject(error)

      return
    }

    // eslint-disable-next-line no-console
    console.log('')
    log(error)

    const runResults: BaseReporterResults = (this.intermediateStats && this.pendingRunnable) ?
      patchRunResultsAfterCrash(error, this.intermediateStats, this.pendingRunnable) :
      defaultStats(error)

    this.terminator.resolve(runResults)
  }
}
