import _ from 'lodash'
import type { FoundBrowser, SpecWithRelativeRoot } from '@packages/types'
import path from 'path'

import type { Cfg } from '../project-base'
import type { ScreenshotMetadata } from './run'

type dateTimeISO = string
type ms = number

interface TestError {
  message: string
  name: string
  stack: string
}

interface AttemptResult {
  error: TestError | null
  failedFromHookId: string | null
  state: string
  timings: {
    lifecycle: number
    test: {
      afterFnDuration: number
      fnDuration: number
    }
  } | null
  videoTimestamp: ms | null
  wallClockStartedAt: dateTimeISO | null
  wallClockDuration: ms | null
}

interface TestResult {
  attempts: AttemptResult[]
  body: string
  displayError: string | null
  state: string
  title: string[]
}

type HookName = 'before' | 'beforeEach' | 'afterEach' | 'after'

interface HookInformation {
  hookName: HookName
  title: string[]
  body: string
}

export interface RunResult {
  error: string | null
  hooks: HookInformation[]
  reporter: string
  reporterStats: object
  screenshots: ScreenshotMetadata[]
  skippedSpec: boolean
  spec: SpecWithRelativeRoot
  stats: {
    duration: ms
    failures: number
    passes: number
    pending: number
    skipped: number
    suites: number
    tests: number
    wallClockDuration?: number
    wallClockEndedAt: dateTimeISO
    wallClockStartedAt: dateTimeISO
  }
  tests: TestResult[]
  video: string | null
}

export interface CypressRunResult {
  browserName: string
  browserPath: string
  browserVersion: string
  config: Cfg
  cypressVersion: string
  endedTestsAt: dateTimeISO
  osName: string
  osVersion: string
  runs: RunResult[]
  runUrl?: string
  startedTestsAt: dateTimeISO
  status: 'finished'
  totalDuration: ms
  totalFailed: number
  totalPassed: number
  totalPending: number
  totalSkipped: number
  totalSuites: number
  totalTests: number
}

const createPublicTest = (test: TestResult): CypressCommandLine.TestResult => {
  const duration = _.reduce(test.attempts, (memo, attempt) => {
    return memo + (attempt.wallClockDuration || 0)
  }, 0)

  return {
    attempts: _.map(test.attempts, ({ state }) => ({ state })),
    displayError: test.displayError,
    duration,
    state: test.state,
    title: test.title,
  }
}

export const createPublicRun = (run: RunResult): CypressCommandLine.RunResult => ({
  error: run.error,
  reporter: run.reporter,
  reporterStats: run.reporterStats,
  screenshots: _.map(run.screenshots, (screenshot) => ({
    height: screenshot.height,
    name: screenshot.name,
    path: screenshot.path,
    takenAt: screenshot.takenAt,
    width: screenshot.width,
  })),
  spec: createPublicSpec(run.spec),
  stats: {
    duration: run.stats.wallClockDuration,
    endedAt: run.stats.wallClockEndedAt,
    failures: run.stats.failures,
    passes: run.stats.passes,
    pending: run.stats.pending,
    skipped: run.stats.skipped,
    startedAt: run.stats.wallClockStartedAt,
    suites: run.stats.suites,
    tests: run.stats.tests,
  },
  tests: _.map(run.tests, createPublicTest),
  video: run.video,
})

/**
 * Normalize browser object to remove private props and make it more consistent
 */
export const createPublicBrowser = (browser: Cypress.Browser | FoundBrowser): Cypress.PublicBrowser => {
  return {
    channel: browser.channel,
    displayName: browser.displayName,
    family: browser.family,
    majorVersion: browser.majorVersion,
    name: browser.name,
    path: browser.path,
    version: browser.version,
  }
}

const omitConfigKeys = [
  'additionalIgnorePattern',
  'autoOpen',
  'browserUrl',
  'clientRoute',
  'cypressEnv',
  'devServerPublicPathRoute',
  'morgan',
  'namespace',
  'proxyServer',
  'proxyUrl',
  'rawJson',
  'remote',
  'repoRoot',
  'report',
  'reporterRoute',
  'reporterUrl',
  'resolved',
  'setupNodeEvents',
  'socketId',
  'socketIoCookie',
  'socketIoRoute',
  'specs',
  'state',
  'supportFolder',
  'isDefaultProtocolEnabled',
  'hideCommandLog',
  'hideRunnerUi',
]

/**
 * Normalize config object to remove private props and make it more consistent
 */
export const createPublicConfig = (config: Cfg): CypressCommandLine.PublicConfig => {
  // this removes/changes values while leaving all others as-is, so that new
  // config properties don't need to be manually accounted for
  return {
    ..._.omit(config, omitConfigKeys) as Omit<CypressCommandLine.PublicConfig, 'browsers' | 'cypressInternalEnv'>,
    browsers: _.map(config.browsers, createPublicBrowser),
    // @ts-expect-error
    cypressInternalEnv: config.cypressEnv,
  }
}

/**
 * Normalize results for module API/after:run to remove private props and make
 * them more consistent and user-friendly
 */
export const createPublicRunResults = (results: CypressRunResult): CypressCommandLine.CypressRunResult => ({
  browserName: results.browserName,
  browserPath: results.browserPath,
  browserVersion: results.browserVersion,
  config: createPublicConfig(results.config),
  cypressVersion: results.cypressVersion,
  endedTestsAt: results.endedTestsAt,
  osName: results.osName,
  osVersion: results.osVersion,
  runs: _.map(results.runs, createPublicRun),
  runUrl: results.runUrl,
  startedTestsAt: results.startedTestsAt,
  totalDuration: results.totalDuration,
  totalFailed: results.totalFailed,
  totalPassed: results.totalPassed,
  totalPending: results.totalPending,
  totalSkipped: results.totalSkipped,
  totalSuites: results.totalSuites,
  totalTests: results.totalTests,
})

/**
 * Normalize spec object to remove private props and make it more consistent
 */
export const createPublicSpec = (spec: SpecWithRelativeRoot): CypressCommandLine.SpecResult => {
  return {
    absolute: spec.absolute,
    fileExtension: spec.fileExtension,
    fileName: spec.fileName,
    name: path.basename(spec.name || ''),
    relative: spec.relative,
  }
}

/**
 * Normalize results for after:spec to remove private props and make
 * them more consistent and user-friendly
 */
export const createPublicSpecResults = (spec: SpecWithRelativeRoot, runResult: RunResult) => {
  return [createPublicSpec(spec), createPublicRun(runResult)]
}

/**
 * Once a spec has finished, its full RunResult has already been consumed by the
 * per-spec sinks: the Cloud upload (`afterSpecRun` -> `postInstanceResults`),
 * the `after:spec` event, console reporting (`displayResults`), and video
 * chapter generation. For the rest of the run we only need what feeds the
 * end-of-run aggregate (`sumByProp` over `stats`), the summary table, the
 * exit-code logic (`skippedSpec`/`totalFailed`), and `createPublicRunResults`.
 *
 * Retaining the full per-spec payload (test bodies, per-attempt error
 * stacks/code frames, hook bodies, timings) for every spec causes server memory
 * to grow unbounded across large multi-spec runs. This trims each retained
 * RunResult down to exactly those fields, freeing the heavy data once it is no
 * longer needed. The trimmed shape is a strict superset of what
 * `createPublicRun` reads, so the public Module API result, the JSON report, and
 * the `after:run` payload are unchanged.
 */
export const toLeanRunResult = (run: RunResult): RunResult => {
  return {
    ...run,
    // hooks are not present in the public run result and are only used per-spec
    hooks: [],
    tests: _.map(run.tests, (test) => ({
      title: test.title,
      state: test.state,
      displayError: test.displayError,
      // `body` is not read after per-spec reporting - drop it to free memory
      body: '',
      attempts: _.map(test.attempts, (attempt) => ({
        // only `state` and `wallClockDuration` survive into the public result
        state: attempt.state,
        wallClockDuration: attempt.wallClockDuration,
        // the remaining fields carry the heavy data (error stacks, code frames,
        // timings) and are not read post per-spec reporting
        error: null,
        failedFromHookId: null,
        timings: null,
        videoTimestamp: null,
        wallClockStartedAt: null,
      })),
    })),
  }
}
