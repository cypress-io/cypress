/* eslint-disable @cypress/dev/arrow-body-multiline-braces */

import type { SpecWithRelativeRoot } from '@packages/types'
import path from 'path'

import { each, remapKeys, remove, renameKey, setValue } from '../util/obj_utils'

type dateTimeISO = string
type ms = number
type pixels = number

interface TestError {
  message: string
  name: string
  stack: string
}

interface AttemptResult {
  duration: ms
  error: TestError | null
  startedAt: dateTimeISO
  state: string
  videoTimestamp: ms
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

interface ScreenshotInformation {
  height: pixels
  name: string
  path: string
  takenAt: dateTimeISO
  width: pixels
}

interface RunResult {
  error: string | null
  hooks: HookInformation[]
  reporter: string
  reporterStats: object
  screenshots: ScreenshotInformation[]
  skippedSpec: boolean
  spec: {
    name: string
    relative: string
    absolute: string
    relativeToCommonRoot: string
  }
  stats: {
    suites: number
    tests: number
    passes: number
    pending: number
    skipped: number
    failures: number
    startedAt: dateTimeISO
    endedAt: dateTimeISO
    duration: ms
    wallClockDuration?: number
  }
  tests: TestResult[]
  video: string | null
}

/**
   * Results returned by the test run.
   * @see https://on.cypress.io/module-api
   */
export interface CypressRunResult {
  browserName: string
  browserPath: string
  browserVersion: string
  config: Cypress.ResolvedConfigOptions
  cypressVersion: string
  endedTestsAt: dateTimeISO
  osName: string
  osVersion: string
  runs: RunResult[]
  /**
   * If Cypress test run is being recorded, full url will be provided.
   * @see https://on.cypress.io/cloud-introduction
   */
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

const normalizeSpec = {
  baseName: remove,
  name: (obj) => {
    obj.name = path.basename(obj.name)
  },
  fileExtension: remove,
  fileName: remove,
  id: remove,
  relativeToCommonRoot: remove,
  specFileExtension: remove,
  specType: remove,
}

const normalizeRun = {
  hooks: remove,
  runUrl: remove,
  screenshots: remove,
  shouldUploadVideo: remove,
  spec: normalizeSpec,
  stats: {
    wallClockDuration: renameKey('duration'),
    wallClockEndedAt: renameKey('endedAt'),
    wallClockStartedAt: renameKey('startedAt'),
  },
  tests: each((test) => ({
    attempts: each((attempt, i) => ({
      error: remove,
      failedFromHookId: remove,
      timings: remove,
      videoTimestamp: remove,
      wallClockDuration: renameKey('duration'),
      wallClockEndedAt: remove,
      wallClockStartedAt: renameKey('startedAt'),
    })),
    body: remove,
    testId: remove,
  })),
}

/**
 * Normalize results for module API/after:run to remove private props and make
 * them more consistent and user-friendly
 */
export const normalizeRunResults = (results: CypressRunResult, runUrl: string | undefined): CypressCommandLine.CypressRunResult => {
  const normalizedResults = remapKeys(results, {
    config: setValue(remapKeys(results.config, {
      additionalIgnorePattern: remove,
      autoOpen: remove,
      browsers: each((browser) => ({
        minSupportedVersion: remove,
      })),
      browserUrl: remove,
      clientRoute: remove,
      cypressEnv: renameKey('cypressInternalEnv'),
      devServerPublicPathRoute: remove,
      morgan: remove,
      namespace: remove,
      proxyServer: remove,
      proxyUrl: remove,
      rawJson: remove,
      remote: remove,
      repoRoot: remove,
      report: remove,
      reporterRoute: remove,
      reporterUrl: remove,
      resolved: remove,
      setupNodeEvents: remove,
      socketId: remove,
      socketIoCookie: remove,
      socketIoRoute: remove,
      specs: remove,
      state: remove,
      supportFolder: remove,
    })),
    runs: each((run) => normalizeRun),
    status: remove,
  })

  normalizedResults.cloudUrl = runUrl

  const screenshots = results.runs.flatMap((run) => run.screenshots)

  normalizedResults.screenshots = each((screenshot) => ({
    screenshotId: remove,
    testId: remove,
    testAttemptIndex: remove,
  }))(null, null, screenshots)

  normalizedResults.stats = {
    duration: results.totalDuration,
    startedAt: results.startedTestsAt,
    endedAt: results.endedTestsAt,
  }

  return normalizedResults
}

/**
 * Normalize results for after:spec to remove private props and make
 * them more consistent and user-friendly
 */
export const normalizeSpecResults = (spec: SpecWithRelativeRoot, results: CypressCommandLine.RunResult) => {
  const normalizedSpec = remapKeys(spec, normalizeSpec)
  const normalizedResults = remapKeys(results, normalizeRun)

  return [normalizedSpec, normalizedResults]
}
