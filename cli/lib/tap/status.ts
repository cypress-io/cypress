import { CypressInstanceError, resolveLiveInstance } from '../cypress-instances'
import type { ReadyInstanceState } from '../cypress-instances'
import { withTapSession, TapTransportError, validateExecResult } from './tap-session'
import { renderFailure, renderResult, renderStatusHelp } from './output'
import { TAP_EXEC_METHOD } from '@packages/cypress-instances'
import type { TapCliOptions } from '../exec/tap'

interface TapRunState {
  spec: string | null
  totalSpecs: number
  state?: 'running' | 'passed' | 'failed'
  totalTests?: number
  results?: { passed: number, failed: number, pending: number, skipped: number }
}

interface TapStatus {
  status: string
  pid?: number
  projectRoot?: string
  testingType?: 'e2e' | 'component' | null
  browserAttached?: boolean
  totalSpecs?: number
  spec?: string
  totalTests?: number
  results?: { passed: number, failed: number, pending: number, skipped: number }
}

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

export const reportStatus = async (options: TapCliOptions, wantsHelp: boolean): Promise<number> => {
  if (wantsHelp) {
    renderStatusHelp()

    return 0
  }

  let selection

  try {
    selection = await resolveLiveInstance({ project: options.project, instance: options.instance, cwd: process.cwd() })
  } catch (err) {
    // No live instance is itself a status a poller waits on, not a failure.
    if (err instanceof CypressInstanceError) {
      renderResult({ status: 'not connected' } satisfies TapStatus)

      return 0
    }

    throw err
  }

  const { instance } = selection
  const browserAttached = instance.cdpBrowserWsUrl !== null
  // testingType joined the discovery record after this branch's base; read it
  // defensively and omit it until the field propagates up the stack.
  const testingType = (instance as { testingType?: 'e2e' | 'component' | null }).testingType

  const base: TapStatus = {
    status: 'browser not selected',
    pid: instance.pid,
    projectRoot: instance.projectRoot,
    ...(testingType !== undefined ? { testingType } : {}),
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
        // run-state has no domain failures, so an { error } envelope means the
        // running Cypress lacks the command — a binding mismatch, not a stage.
        throw new TapTransportError('INVALID_EXEC_RESULT', `${outcome.error.code}: ${outcome.error.message}`)
      }

      return outcome.result as TapRunState
    })

    renderResult(mergeRunState(base, runState))

    return 0
  } catch (err: any) {
    // A browser is attached but the instance is unreachable (still loading, tab
    // closed, CDP gone) — a transport fault, surfaced like other commands.
    if (err instanceof TapTransportError) {
      renderFailure(err)

      return 1
    }

    throw err
  }
}
