import { CypressInstanceError, resolveLiveInstance } from '../../cypress-instances'
import { TapSpecsOperation, tapRunSpecOperation } from '@packages/cypress-instances'
import { queryInstanceGraphql } from '../instance-gql'
import { renderFailure, renderKnownFailure, renderResult } from '../output'
import { defineNativeCommand } from './definition'
import type { TapCliOptions } from '../types'

const posixify = (specPath: string) => specPath.replace(/\\/g, '/')

// `runSpec` resolves the spec against the project's specPattern and reads it off
// disk, so it needs an absolute path; the CLI matches the project-relative path
// the specs command lists against the instance's own spec list and sends that
// spec's absolute path, so it never does path math against the project root.
const runSpec = async (options: TapCliOptions, args: Record<string, string>): Promise<number> => {
  try {
    const { instance } = await resolveLiveInstance({ instance: options.instance, cwd: process.cwd() })
    const specsData = await queryInstanceGraphql(instance, TapSpecsOperation)
    const wanted = posixify(args.spec)
    // The spec list crosses the wire unvalidated, so fields are guarded as strings.
    const match = (specsData.currentProject?.specs ?? []).find((spec) => {
      return typeof spec?.relative === 'string' && typeof spec.absolute === 'string' && posixify(spec.relative) === wanted
    })

    if (!match) {
      renderFailure({ code: 'SPEC_NOT_FOUND', message: `No spec matches the path "${args.spec}" — use the specs command to list runnable specs.` })

      return 1
    }

    const { runSpec: result } = await queryInstanceGraphql(instance, tapRunSpecOperation(match.absolute))

    if (result?.__typename === 'RunSpecResponse') {
      renderResult({
        spec: result.spec.relative.replace(/\\/g, '/'),
        testingType: result.testingType,
        browser: result.browser.displayName,
      })

      return 0
    }

    // Surface the instance's own RunSpecError verbatim, so the CLI reports the same
    // code and wording the app produces for that failure rather than re-languaging it.
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
