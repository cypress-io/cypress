import { CypressSessionError, resolveLiveSession } from '../../cypress-sessions'
import type { ReadySessionState } from '../../cypress-sessions'
import { withTapConnection, validateExecResult } from '../tap-connection'
import { renderFailure, renderKnownFailure, renderOutcome } from '../output'
import { TAP_EXEC_METHOD } from '@packages/cypress-sessions'
import { defineNativeCommand } from './definition'
import type { TapCliOptions, TapRunState, TapStatus } from '../types'

const mergeRunState = (base: TapStatus, runState: TapRunState): TapStatus => {
  const pinned = runState.pinned ? { pinned: runState.pinned } : {}

  if (runState.state === undefined) {
    return { ...base, status: 'spec not selected', totalSpecs: runState.totalSpecs, ...pinned }
  }

  return {
    ...base,
    status: runState.state,
    totalSpecs: runState.totalSpecs,
    ...(runState.spec !== null ? { spec: runState.spec } : {}),
    startedAt: runState.startedAt ?? null,
    totalTests: runState.totalTests,
    results: runState.results,
    ...(runState.error ? { error: runState.error } : {}),
    ...pinned,
  }
}

const reportStatus = async (options: TapCliOptions): Promise<number> => {
  let selection

  try {
    selection = await resolveLiveSession({ session: options.instance, cwd: process.cwd() })
  } catch (err) {
    if (err instanceof CypressSessionError) {
      // Polling cannot outlast an session tap will never be able to drive, so
      // that one is a failure where every other resolution error is a status a
      // poller waits on.
      if (err.code === 'UNSUPPORTED_BROWSER') {
        renderFailure(err)

        return 1
      }

      renderOutcome('status', { status: 'not connected' } satisfies TapStatus, options.json)

      return 0
    }

    throw err
  }

  const { session } = selection
  const browserAttached = session.cdpBrowserWsUrl !== null

  const base: TapStatus = {
    status: 'browser not selected',
    pid: session.pid,
    projectRoot: session.projectRoot,
    testingType: session.testingType,
    browserAttached,
    browserName: session.browserName,
  }

  if (!browserAttached) {
    renderOutcome('status', base, options.json)

    return 0
  }

  try {
    const outcome = await withTapConnection(session as ReadySessionState, async (connection) => {
      return validateExecResult(await connection.call(TAP_EXEC_METHOD, ['run-state', {}, {}]))
    }, options.timeout)

    if ('error' in outcome) {
      renderFailure(outcome.error)

      return 1
    }

    renderOutcome('status', mergeRunState(base, outcome.result as TapRunState), options.json)

    return 0
  } catch (err: any) {
    // A degraded session reached this far carries a code (e.g. an unresponsive
    // renderer); the earlier catch only covers sessions that never resolved.
    if (err instanceof CypressSessionError) {
      renderFailure(err)

      return 1
    }

    if (err.known && err.details) {
      renderKnownFailure(err)

      return 1
    }

    throw err
  }
}

export const statusCommand = defineNativeCommand('status', reportStatus)
