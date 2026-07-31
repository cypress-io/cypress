import { CypressInstanceError, resolveLiveInstance } from '../../cypress-instances'
import { LiveInstanceState, TapSpecsOperation, tapRunSpecOperation } from '@packages/cypress-instances'
import { queryInstanceGraphql } from '../instance-gql'
import { renderFailure, renderKnownFailure, renderOutcome } from '../output'
import { defineNativeCommand } from './definition'
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
      renderFailure({ code: 'SPEC_NOT_FOUND', message: `No spec matches the path "${args.spec}" — use the specs command to list runnable specs.` })

      return 1
    }

    const { runSpec: result } = await queryInstanceGraphql(instance, tapRunSpecOperation(match.absolute), RUN_SPEC_TIMEOUT_MS)

    if (result?.__typename === 'RunSpecResponse') {
      const launched: TapRunResult = {
        spec: result.spec.relative.replace(/\\/g, '/'),
        testingType: result.testingType,
        browser: result.browser.displayName,
      }

      renderOutcome('run', launched, options.json)

      return 0
    }

    const failure = result?.__typename === 'RunSpecError'
      ? { code: result.code, message: result.detailMessage ?? `The spec "${args.spec}" could not be run.` }
      : { code: 'RUN_FAILED', message: `The instance returned no result for running "${args.spec}".` }

    renderFailure(failure)

    return 1
  } catch (err: any) {
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

export const runCommand = defineNativeCommand('run', runSpec)
