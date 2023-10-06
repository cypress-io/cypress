import type { ProjectBase } from '../project-base'
import type { BaseReporterResults, ReporterResults } from '../types/reporter'
import * as errors from '../errors'
import Debug from 'debug'
import pDefer, { DeferredPromise } from 'p-defer'

const debug = Debug('cypress:util:crash_handling')

const patchRunResultsAfterCrash = (error: Error, reporterResults: ReporterResults, mostRecentRunnable: any): ReporterResults => {
  const endTime: number = reporterResults?.stats?.wallClockEndedAt ? Date.parse(reporterResults?.stats?.wallClockEndedAt) : new Date().getTime()
  const wallClockDuration = reporterResults?.stats?.wallClockStartedAt ?
    endTime - Date.parse(reporterResults.stats.wallClockStartedAt) : 0
  const endTimeStamp = new Date(endTime).toJSON()

  // in crash situations, the most recent report will not have the triggering test
  // so the results are manually patched, which produces the expected exit=1 and
  // terminal output indicating the failed test
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
      if (test.testId === mostRecentRunnable.id) {
        return {
          ...test,
          state: 'failed',
          attempts: [
            ...test.attempts.slice(0, -1),
            {
              ...test.attempts[test.attempts.length - 1],
              state: 'failed',
            },
          ],
        }
      }

      return test
    }),
    error: errors.stripAnsi(error.message),
  }
}

const defaultStats = (error: Error): BaseReporterResults => {
  return {
    error: errors.stripAnsi(error.message),
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

  waitForEarlyExit (project: ProjectBase, exit?: boolean) {
    debug('waiting for early exit')

    project.on('test:before:run', ({
      runnable,
      previousResults,
    }) => {
      debug('preparing to run test, previous stats reported as %O', previousResults)

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
    errors.log(error)

    const runResults: BaseReporterResults = (this.intermediateStats && this.pendingRunnable) ?
      patchRunResultsAfterCrash(error, this.intermediateStats, this.pendingRunnable) :
      defaultStats(error)

    this.terminator.resolve(runResults)
  }
}
