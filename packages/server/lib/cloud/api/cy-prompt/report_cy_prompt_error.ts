import type { CyPromptCloudApi } from '@packages/types/src/cy-prompt/cy-prompt-server-types'
import Debug from 'debug'
import { stripPath } from '../../strip_path'
const debug = Debug('cypress:server:cloud:api:cy-prompt:report_cy_prompt_error')

export interface ReportCyPromptErrorOptions {
  cloudApi: CyPromptCloudApi
  cyPromptHash: string | undefined
  projectSlug: string | undefined
  error: unknown
  cyPromptMethod: string
  cyPromptMethodArgs?: unknown[]
  additionalHeaders?: Record<string, string>
}

interface CyPromptError {
  name: string
  stack: string
  message: string
  code?: string | number
  errno?: string | number
  cyPromptMethod: string
  cyPromptMethodArgs?: string
}

interface CyPromptErrorPayload {
  cyPromptHash: string | undefined
  projectSlug: string | undefined
  errors: CyPromptError[]
}

export function reportCyPromptError ({
  cloudApi,
  cyPromptHash,
  projectSlug,
  error,
  cyPromptMethod,
  cyPromptMethodArgs,
  additionalHeaders,
}: ReportCyPromptErrorOptions): void {
  debug('Error reported:', error)

  if (process.env.CYPRESS_CRASH_REPORTS === '0') {
    return
  }

  // When developing locally, do not send to Sentry, but instead log to console.
  if (
    process.env.CYPRESS_LOCAL_CY_PROMPT_PATH ||
    process.env.NODE_ENV === 'development' ||
    process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF
  ) {
    // eslint-disable-next-line no-console
    console.error(`Error in ${cyPromptMethod}:`, error)

    return
  }

  let errorObject: Error

  if (!(error instanceof Error)) {
    errorObject = new Error(String(error))
  } else {
    errorObject = error
  }

  let cyPromptMethodArgsString: string | undefined

  if (cyPromptMethodArgs) {
    try {
      cyPromptMethodArgsString = JSON.stringify({
        args: cyPromptMethodArgs,
      })
    } catch (e: unknown) {
      cyPromptMethodArgsString = `Unknown args: ${e}`
    }
  }

  try {
    const payload: CyPromptErrorPayload = {
      cyPromptHash,
      projectSlug,
      errors: [{
        name: stripPath(errorObject.name ?? `Unknown name`),
        stack: stripPath(errorObject.stack ?? `Unknown stack`),
        message: stripPath(errorObject.message ?? `Unknown message`),
        code: 'code' in errorObject ? errorObject.code as string : undefined,
        errno: 'errno' in errorObject ? errorObject.errno as number : undefined,
        cyPromptMethod,
        cyPromptMethodArgs: cyPromptMethodArgsString ? stripPath(cyPromptMethodArgsString) : undefined,
      }],
    }

    cloudApi.CloudRequest.post(
      `${cloudApi.cloudUrl}/cy-prompt/errors`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          ...additionalHeaders,
        },
      },
    ).catch((e: unknown) => {
      debug(
        `Error calling CyPromptManager.reportError: %o, original error %o`,
        e,
        error,
      )
    })
  } catch (e: unknown) {
    debug(
      `Error calling CyPromptManager.reportError: %o, original error %o`,
      e,
      error,
    )
  }
}
