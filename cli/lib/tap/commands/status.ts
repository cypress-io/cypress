import { CypressInstanceError, resolveLiveInstance } from '../../cypress-instances'
import type { ReadyInstanceState } from '../../cypress-instances'
import { withTapSession, throwTapError, validateExecResult } from '../tap-session'
import { renderKnownFailure, renderResult } from '../output'
import { TAP_EXEC_METHOD } from '@packages/cypress-instances'
import { errors } from '../../errors'
import type { TapCliCommand, TapCliOptions, TapRunState, TapStatus } from '../types'

const STATUS_USAGE = `Usage: cypress tap status [options]

Reports where a running Cypress instance is in its lifecycle, as JSON — for
polling and "where am I?" checks. Always exits 0 for a determinable stage
(including "not connected"); a poller branches on the \`status\` field.

Stages: not connected, browser not selected, spec not selected, running,
passed, failed.

Options:
  --instance <pid>  report the instance with this pid`

const mergeRunState = (base: TapStatus, runState: TapRunState): TapStatus => {
  if (runState.state === undefined) {
    return { ...base, status: 'spec not selected', totalSpecs: runState.totalSpecs }
  }

  return {
    ...base,
    status: runState.state,
    totalSpecs: runState.totalSpecs,
    ...(runState.spec !== null ? { spec: runState.spec } : {}),
    totalTests: runState.totalTests,
    results: runState.results,
  }
}

const reportStatus = async (options: TapCliOptions): Promise<number> => {
  let selection

  try {
    selection = await resolveLiveInstance({ instance: options.instance, cwd: process.cwd() })
  } catch (err) {
    // No live instance is a status a poller waits on, not a failure.
    if (err instanceof CypressInstanceError) {
      renderResult({ status: 'not connected' } satisfies TapStatus)

      return 0
    }

    throw err
  }

  const { instance } = selection
  const browserAttached = instance.cdpBrowserWsUrl !== null

  const base: TapStatus = {
    status: 'browser not selected',
    pid: instance.pid,
    projectRoot: instance.projectRoot,
    testingType: instance.testingType,
    browserAttached,
  }

  if (!browserAttached) {
    renderResult(base)

    return 0
  }

  try {
    const runState = await withTapSession(instance as ReadyInstanceState, async (session) => {
      const outcome = validateExecResult(await session.call(TAP_EXEC_METHOD, ['run-state', {}, {}]))

      if ('error' in outcome) {
        return throwTapError(errors.tapInvalidExecResult, `${outcome.error.code}: ${outcome.error.message}`)
      }

      return outcome.result as TapRunState
    })

    renderResult(mergeRunState(base, runState))

    return 0
  } catch (err: any) {
    if (err.known && err.details) {
      renderKnownFailure(err)

      return 1
    }

    throw err
  }
}

export const statusCommand: TapCliCommand = {
  name: 'status',
  description: 'report where a running Cypress instance is in its lifecycle',
  usage: STATUS_USAGE,
  handler: reportStatus,
}
