import { resolveLiveSession } from '../../cypress-sessions'
import { TAP_TARGET, TapSpecsOperation, tapRunSpecOperation } from '@packages/cypress-sessions'
import { querySessionGraphql } from '../session-gql'
import { renderOutcome, renderTapFailure } from '../output'
import { defineNativeCommand } from './definition'
import type { TapErrorCode, LiveSessionState } from '@packages/cypress-sessions'
import type { TapCliOptions } from '../types'
import { posixify } from '../../util'

/** What `cypress tap run` returns once a spec is requested. Poll `status` for progress. */
export interface TapRunResult {
  /** Project-relative path of the requested spec. */
  spec: string
  /** The spec has been requested; not a live run-state — poll `status` for that. */
  status: 'running'
}

const RUN_SPEC_TIMEOUT_MS = 60_000

// The session's runSpec mutation names its failures with its own codes; each maps
// to the tap code whose copy describes it. A code this CLI does not know reads as
// the session failing to start the spec, which is what it observed.
const RUN_SPEC_FAILURES: Record<string, TapErrorCode> = {
  GENERAL_ERROR: 'SPEC_START_FAILED',
  NO_PROJECT: 'NO_PROJECT',
  NO_SPEC_PATTERN_MATCH: 'SPEC_NOT_FOUND',
  SPEC_NOT_FOUND: 'SPEC_NOT_FOUND',
  TESTING_TYPE_NOT_CONFIGURED: 'TESTING_TYPE_NOT_CONFIGURED',
}

const findTargetSpec = async (session: LiveSessionState, relative: string) => {
  const specsData = await querySessionGraphql(session, TapSpecsOperation)
  const wanted = posixify(relative)

  return (specsData.currentProject?.specs ?? []).find((spec) => posixify(spec.relative) === wanted)
}

const runSpec = async (options: TapCliOptions, args: { spec: string }): Promise<number> => {
  try {
    const { session } = await resolveLiveSession({ session: options.session, cwd: process.cwd() })

    const match = await findTargetSpec(session, args.spec)

    if (!match) {
      return await renderTapFailure({ code: 'SPEC_NOT_FOUND', detail: `Looked for "${args.spec}".` })
    }

    const { runSpec: result } = await querySessionGraphql(session, tapRunSpecOperation(match.absolute), RUN_SPEC_TIMEOUT_MS)

    if (result?.__typename === 'RunSpecResponse') {
      const launched: TapRunResult = {
        spec: posixify(result.spec.relative),
        status: 'running',
      }

      renderOutcome('run', launched, options.json)

      return 0
    }

    const failure = result?.__typename === 'RunSpecError'
      ? { code: RUN_SPEC_FAILURES[result.code] ?? 'SPEC_START_FAILED', detail: result.detailMessage ?? undefined }
      : { code: 'SPEC_START_FAILED', detail: `The ${TAP_TARGET} returned no result for "${args.spec}".` }

    return await renderTapFailure(failure)
  } catch (err: any) {
    return await renderTapFailure(err)
  }
}

export const runCommand = defineNativeCommand('run', runSpec)
