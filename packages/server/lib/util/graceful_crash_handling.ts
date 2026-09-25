import type { ProjectBase } from '../project-base'
import type { BaseReporterResults, ReporterResults, ReporterTestError } from '../types/reporter'
import { log, stackUtils, stripAnsi } from '@packages/errors'
import Debug from 'debug'

const debug = Debug('cypress:util:crash_handling')

/** Matches attempt `error` shape from `reporter.js` `normalizeTest` for Cypress Cloud. */
export const fatalErrorToAttemptError = (error: Error): ReporterTestError => {
  const codeFrame = (error as { codeFrame?: ReporterTestError['codeFrame'] }).codeFrame
  const stackLines = error.stack ? stackUtils.stackWithoutMessage(error.stack) : undefined

  return {
    name: error.name,
    message: stripAnsi(error.message),
    stack: stackLines !== undefined ? stripAnsi(stackLines) : undefined,
    ...(codeFrame !== undefined ? { codeFrame } : {}),
  }
}

// Cypress errors from `errors.get()` capture their stack from a separate, empty
// Error, so `error.stack` does not contain the message. Rebuild the usual
// "Name: message" header so the message is always part of displayError.
const fatalErrorToDisplayError = (error: Error): string => {
  const stackLines = error.stack ? stackUtils.stackWithoutMessage(error.stack) : ''

  return stripAnsi(stackLines ? `${error.name}: ${error.message}\n${stackLines}` : error.message)
}

const parseReporterTimestamp = (value?: Date | string): number | undefined => {
  if (!value) {
    return undefined
  }

  if (value instanceof Date) {
    return value.getTime()
  }

  return Date.parse(value)
}

const formatTitlePath = (title: string[]) => title.join(' > ')

export const patchRunResultsAfterCrash = (
  error: Error,
  reporterResults: ReporterResults,
  mostRecentRunnable: { id?: string } | undefined,
): ReporterResults => {
  const endTime: number = parseReporterTimestamp(reporterResults?.stats?.wallClockEndedAt) ?? new Date().getTime()
  const wallClockStartedAt = parseReporterTimestamp(reporterResults?.stats?.wallClockStartedAt)
  const wallClockDuration = wallClockStartedAt ?
    endTime - wallClockStartedAt : 0
  const endTimeStamp = new Date(endTime).toJSON()

  const tests = reporterResults?.tests || []
  const crashedIndex = tests.findIndex((test) => test.testId === mostRecentRunnable?.id)
  // Tests after the crashed one never ran and are reported as skipped with no
  // reason, so give them one that names the test the spec ended on.
  const skippedDisplayError = crashedIndex === -1 ? null : [
    `This test did not run because the spec ended early during "${formatTitlePath(tests[crashedIndex].title)}":`,
    '',
    stripAnsi(error.message).split('\n')[0],
  ].join('\n')

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
    tests: tests.map((test, index) => {
      if (crashedIndex !== -1 && index > crashedIndex && test.state === 'skipped') {
        return {
          ...test,
          displayError: skippedDisplayError,
        }
      }

      if (test.testId === mostRecentRunnable?.id) {
        const prevAttempts = test.attempts.slice(0, -1)
        const lastAttempt = test.attempts[test.attempts.length - 1]
        const attemptError = fatalErrorToAttemptError(error)

        return {
          ...test,
          state: 'failed',
          displayError: fatalErrorToDisplayError(error),
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
  private terminator: PromiseWithResolvers<BaseReporterResults>

  private pendingRunnable: any
  private intermediateStats: ReporterResults | undefined

  constructor () {
    this.terminator = Promise.withResolvers<BaseReporterResults>()
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

  // Title path of the test that was running, e.g. "suite > test". Undefined if
  // no test has started yet in this spec.
  get pendingTestTitle (): string | undefined {
    if (!this.pendingRunnable) {
      return undefined
    }

    const test = this.intermediateStats?.tests?.find((t) => t.testId === this.pendingRunnable.id)

    return test ? formatTitlePath(test.title) : this.pendingRunnable.title
  }

  exitEarly (error) {
    if (error.isFatalApiErr) {
      this.terminator.reject(error)

      return
    }

    // eslint-disable-next-line no-console
    console.log('')
    log(error)

    const runResults = (this.intermediateStats && this.pendingRunnable) ?
      patchRunResultsAfterCrash(error, this.intermediateStats, this.pendingRunnable) :
      defaultStats(error)

    this.terminator.resolve(runResults as BaseReporterResults)
  }
}
