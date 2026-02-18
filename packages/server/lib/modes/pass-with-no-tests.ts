import * as system from '../util/system'
import pkg from '@packages/root'
import type { CypressRunResult } from './results'
import type { Cfg } from '../project-base'
import type { FoundBrowser, SpecFile } from '@packages/types'
import { renderSummaryTable, displayRunStarting } from '../util/print-run'
import * as errors from '../errors'
import type { Browser } from '../browsers/types'

export interface EmptyRunOptions {
  browser: FoundBrowser
  config: Cfg
  group: string | undefined
  parallel?: boolean
  tag: string | undefined
  autoCancelAfterFailures?: number | false
  record?: boolean
  quiet?: boolean
  outputPath?: string
  specs: SpecFile[]
  specPattern: string | RegExp | string[]
}

export async function passWithNoTests (
  options: EmptyRunOptions,
) {
  const browser: Browser = options.browser as any as Browser

  if (!options.quiet) {
    displayRunStarting({
      ...options,
      browser,
    })
  }

  if (options.record) {
    errors.warning('CANNOT_ENABLE_FEATURE_WITH_NO_TESTS', { feature: 'record' })
  }

  if (options.parallel) {
    errors.warning('CANNOT_ENABLE_FEATURE_WITH_NO_TESTS', { feature: 'parallelize' })
  }

  const { config } = options
  const sys = await system.info()
  const results: CypressRunResult = {
    status: 'finished',
    startedTestsAt: new Date().toISOString(),
    endedTestsAt: new Date().toISOString(),
    totalDuration: 0,
    totalSuites: 0,
    totalTests: 0,
    totalPassed: 0,
    totalPending: 0,
    totalFailed: 0,
    totalSkipped: 0,
    runs: [],
    browserName: browser.name,
    browserPath: browser.path,
    browserVersion: browser.version,
    osName: sys.osName,
    osVersion: sys.osVersion,
    cypressVersion: pkg.version,
    config,
    runUrl: undefined,
  }

  if (!options.quiet) {
    renderSummaryTable(undefined, results)
  }

  return results
}
