import path from 'path'

import { CypressInstanceError, resolveLiveInstance } from '../../cypress-instances'
import { tapRunSpecOperation } from '@packages/cypress-instances'
import { queryInstanceGraphql } from '../instance-gql'
import { renderFailure, renderKnownFailure, renderResult } from '../output'
import { defineNativeCommand } from './definition'
import type { TapCliOptions } from '../types'

// `runSpec` resolves the spec against the project's specPattern and reads it off
// disk, so it needs an absolute path; the CLI takes the project-relative path the
// specs command lists and resolves it against the instance's project root.
const runSpec = async (options: TapCliOptions, args: Record<string, string>): Promise<number> => {
  try {
    const { instance } = await resolveLiveInstance({ instance: options.instance, cwd: process.cwd() })
    const specPath = path.resolve(instance.projectRoot, args.spec)
    const { runSpec: result } = await queryInstanceGraphql(instance, tapRunSpecOperation(specPath))

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
