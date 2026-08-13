import { resolveLiveInstance } from '../../cypress-instances'
import { LiveInstanceState, TAP_TARGET, TapSpecsOperation, tapRunSpecOperation } from '@packages/cypress-instances'
import { queryInstanceGraphql } from '../instance-gql'
import { renderOutcome, renderTapFailure } from '../output'
import { defineNativeCommand } from './definition'
import type { TapErrorCode } from '@packages/cypress-instances'
import type { TapCliOptions } from '../types'
import { posixify } from '../../util'

/** What `cypress tap run` returns once a spec is launched. */
export interface TapRunResult {
  /** Project-relative path of the launched spec. */
  spec: string
  /** Testing type the run launched under. */
  testingType: string
  /** Display name of the browser the run launched in. */
  browser: string
}

const RUN_SPEC_TIMEOUT_MS = 60_000

// The instance's runSpec mutation names its failures with its own codes; each maps
// to the tap code whose copy describes it. A code this CLI does not know reads as
// the instance failing to start the spec, which is what it observed.
const RUN_SPEC_FAILURES: Record<string, TapErrorCode> = {
  GENERAL_ERROR: 'SPEC_START_FAILED',
  NO_PROJECT: 'NO_PROJECT',
  NO_SPEC_PATTERN_MATCH: 'SPEC_NOT_FOUND',
  SPEC_NOT_FOUND: 'SPEC_NOT_FOUND',
  TESTING_TYPE_NOT_CONFIGURED: 'TESTING_TYPE_NOT_CONFIGURED',
}

const findTargetSpec = async (instance: LiveInstanceState, relative: string) => {
  const specsData = await queryInstanceGraphql(instance, TapSpecsOperation)
  const wanted = posixify(relative)

  return (specsData.currentProject?.specs ?? []).find((spec) => posixify(spec.relative) === wanted)
}

const runSpec = async (options: TapCliOptions, args: { spec: string }): Promise<number> => {
  try {
    const { instance } = await resolveLiveInstance({ instance: options.instance, cwd: process.cwd() })

    const match = await findTargetSpec(instance, args.spec)

    if (!match) {
      return await renderTapFailure({ code: 'SPEC_NOT_FOUND', detail: `Looked for "${args.spec}".` })
    }

    const { runSpec: result } = await queryInstanceGraphql(instance, tapRunSpecOperation(match.absolute), RUN_SPEC_TIMEOUT_MS)

    if (result?.__typename === 'RunSpecResponse') {
      const launched: TapRunResult = {
        spec: posixify(result.spec.relative),
        testingType: result.testingType,
        browser: result.browser.displayName,
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
