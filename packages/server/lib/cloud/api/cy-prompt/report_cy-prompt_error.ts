import type { CyPromptCloudApi } from '@packages/types/src/cy-prompt/cy-prompt-server-types'
import Debug from 'debug'
import { stripPath } from '../../strip_path'
const debug = Debug('cypress:server:cloud:api:cy-prompt:report_cy-prompt_error')

export interface ReportCyPromptErrorOptions {
  cloudApi: CyPromptCloudApi
  cyPromptHash: string | undefined
  projectSlug: string | undefined
  error: unknown
  cyPromptMethod: string
  cyPromptMethodArgs?: unknown[]
}

interface CyPromptError {
  name: string
  stack: string
  message: string
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
}: ReportCyPromptErrorOptions): void {
  debug('Error reported:', error)

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
        cyPromptMethod,
        cyPromptMethodArgs: cyPromptMethodArgsString,
      }],
    }

    cloudApi.CloudRequest.post(
      `${cloudApi.cloudUrl}/cy-prompt/errors`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          ...cloudApi.cloudHeaders,
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
