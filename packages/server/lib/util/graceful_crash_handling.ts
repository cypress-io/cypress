import type { ProjectBase } from '../project-base'
import type { BaseReporterResults, ReporterResults } from '../types/reporter'
import * as errors from '../errors'
import Debug from 'debug'

const debug = Debug('cypress:util:crash_handling')

let earlyExitError: Error

let earlyExit = (err: Error) => {
  debug('set early exit error: %s', err.stack)

  earlyExitError = err
}

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

export const endAfterError = (project: ProjectBase, exit: boolean): Promise<any> => {
  let pendingRunnable: any
  let intermediateStats: ReporterResults

  project.on('test:before:run', ({
    runnable,
    previousResults,
  }) => {
    debug('preparing to run test, previous stats reported as %O', previousResults)

    intermediateStats = previousResults
    pendingRunnable = runnable
  })

  return new Promise((resolve, reject) => {
    const patchedResolve = exit === false ? () => {
      // eslint-disable-next-line no-console
      console.log('not exiting due to options.exit being false')
    } : resolve

    const handleEarlyExit = (error: Error & { isFatalApiErr?: boolean }) => {
      if (error.isFatalApiErr) {
        debug('handling fatal api error', error)
        reject(error)
      } else {
        debug('patching results and resolving')
        // eslint-disable-next-line no-console
        console.log('')
        errors.log(error)
        const results = (intermediateStats && pendingRunnable) ?
          patchRunResultsAfterCrash(error, intermediateStats, pendingRunnable) :
          defaultStats(error)

        debug('resolving with patched results %O', results)
        patchedResolve(results)
      }
    }

    earlyExit = (error) => {
      debug('handling early exit with error', error)
      handleEarlyExit(error)
    }

    if (earlyExitError) {
      handleEarlyExit(earlyExitError)
    }
  })
}

export const exitEarly = (error) => {
  debug('exit early called', error)

  return earlyExit(error)
}
