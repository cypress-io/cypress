import type { ProjectBase } from '../project-base'
import * as errors from '../errors'
import Debug from 'debug'

const debug = Debug('cypress:server:crash_handling')

interface ReporterTestAttempt {
  state: 'skipped' | 'failed' | 'passed'
  error: any
  timings: any
  failedFromHookId: any
  wallClockStartedAt: Date
  wallClockDuration: number
  videoTimestamp: any
}
interface ReporterTest {
  testId: string
  title: string[]
  state: 'skipped' | 'passed' | 'failed'
  body: string
  displayError: any
  attempts: ReporterTestAttempt[]
}
interface ReporterResults {
  error?: string
  stats: {
    failures: number
    tests: number
    passes: number
    pending: number
    suites: number
    skipped: number
    wallClockDuration: number
    wallClockStartedAt: string
    wallClockEndedAt: string
  }
  reporter: string
  reporterStats: {
    suites: number
    tests: number
    passes: number
    pending: number
    failures: number
    start: string
    end: string
    duration: number
  }
  hooks: any[]
  tests: ReporterTest[]
}

export type CypressRunError = Error & {
  isFatalApiErr: boolean
}

let earlyExitError: CypressRunError

let earlyExit = (err: CypressRunError) => {
  debug('set early exit error: %s', err.stack)

  earlyExitError = err
}

const patchRunResultsAfterCrash = (error: CypressRunError, reporterResults: ReporterResults, mostRecentRunnable: any): ReporterResults => {
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

export const endAfterError = (project: ProjectBase, exit: boolean): Promise<any> => {
  let pendingRunnable: any
  let intermediateStats: ReporterResults

  project.on('test:before:run', ({
    runnable,
    previousResults,
  }) => {
    intermediateStats = previousResults
    debug('pending runnable: %O', runnable)
    pendingRunnable = runnable
    previousResults.tests.forEach((t) => {
      debug('test in results: %O', t)
    })
  })

  return new Promise((resolve, reject) => {
    const patchedResolve = exit ? resolve : () => {
      // eslint-disable-next-line no-console
      console.log('not exiting due to options.exit being false')
    }

    const handleEarlyExit = (error) => {
      if (error.isFatalApiErr) {
        reject(error)
      } else {
        patchedResolve(patchRunResultsAfterCrash(error, intermediateStats, pendingRunnable))
      }
    }

    earlyExit = (error) => {
      handleEarlyExit(error)
    }

    if (earlyExitError) {
      handleEarlyExit(earlyExitError)
    }
  })
}

export const exitEarly = (error) => {
  return earlyExit(error)
}
