import { isTapError, resolveLiveInstance } from '../../cypress-instances'
import type { ReadyInstanceState } from '../../cypress-instances'
import { withTapSession, validateExecResult } from '../tap-session'
import { renderOutcome, renderTapFailure } from '../output'
import { TAP_EXEC_METHOD } from '@packages/cypress-instances'
import { defineNativeCommand } from './definition'
import type { TapCliOptions, TapRunState, TapStatus } from '../types'

// The ways an instance can fail to resolve at all. Each is a lifecycle stage
// `status` reports rather than a failure it exits on; anything else really did fail.
// A named `--instance` that has gone is one of them, so a poller watching one pid
// keeps reading `not connected` after it exits rather than starting to error.
const NOT_CONNECTED_CODES: ReadonlySet<string> = new Set(['NO_INSTANCE', 'INSTANCE_NOT_FOUND', 'STALE_INSTANCE'])

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
    if (isTapError(err) && NOT_CONNECTED_CODES.has(err.code)) {
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
      return await renderTapFailure(outcome.error)
    }

    renderOutcome('status', mergeRunState(base, outcome.result as TapRunState), options.json)

    return 0
  } catch (err: any) {
    // A degraded instance reached this far (e.g. an unresponsive renderer); the
    // earlier catch only covers instances that never resolved.
    return await renderTapFailure(err)
  }
}

export const statusCommand = defineNativeCommand('status', reportStatus)
