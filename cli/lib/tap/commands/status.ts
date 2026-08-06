import { CypressInstanceError, resolveLiveInstance } from '../../cypress-instances'
import type { ReadyInstanceState } from '../../cypress-instances'
import { withTapSession, validateExecResult } from '../tap-session'
import { renderFailure, renderKnownFailure, renderOutcome } from '../output'
import { TAP_EXEC_METHOD } from '@packages/cypress-instances'
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
    selection = await resolveLiveInstance({ instance: options.instance, cwd: process.cwd() })
  } catch (err) {
    // No live instance is a status a poller waits on, not a failure.
    if (err instanceof CypressInstanceError) {
      renderOutcome('status', { status: 'not connected' } satisfies TapStatus, options.json)

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
    browserName: instance.browserName,
  }

  if (!browserAttached) {
    renderOutcome('status', base, options.json)

    return 0
  }

  try {
    const outcome = await withTapSession(instance as ReadyInstanceState, async (session) => {
      return validateExecResult(await session.call(TAP_EXEC_METHOD, ['run-state', {}, {}]))
    }, options.timeout)

    if ('error' in outcome) {
      renderFailure(outcome.error)

      return 1
    }

    renderOutcome('status', mergeRunState(base, outcome.result as TapRunState), options.json)

    return 0
  } catch (err: any) {
    // A degraded instance reached this far carries a code (e.g. an unresponsive
    // renderer); the earlier catch only covers instances that never resolved.
    if (err instanceof CypressInstanceError) {
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
