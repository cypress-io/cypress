import type { StudioCloudApi } from '@packages/types/src/studio/studio-server-types'
import Debug from 'debug'
import { stripPath } from '../../strip_path'
const debug = Debug('cypress:server:cloud:api:studio:report_studio_errors')
import { logError } from '@packages/stderr-filtering'
import exception from '../../exception'

export interface ReportStudioErrorOptions {
  cloudApi: StudioCloudApi
  studioHash: string | undefined
  projectSlug: string | undefined
  error: unknown
  studioMethod: string
  studioMethodArgs?: unknown[]
}

interface StudioError {
  name: string
  stack: string
  message: string
  code?: string | number
  errno?: string | number
  studioMethod: string
  studioMethodArgs?: string
}

interface StudioErrorPayload {
  studioHash: string | undefined
  projectSlug: string | undefined
  errors: StudioError[]
}

export function reportStudioError ({
  cloudApi,
  studioHash,
  projectSlug,
  error,
  studioMethod,
  studioMethodArgs,
}: ReportStudioErrorOptions): void {
  debug('Error reported:', error)

  if (process.env.CYPRESS_CRASH_REPORTS === '0') {
    return
  }

  const errorToReport = error instanceof AggregateError ? error.errors[error.errors.length - 1] : error

  // When developing locally, do not send to Sentry, but instead log to console.
  if (
    process.env.CYPRESS_LOCAL_STUDIO_PATH ||
    process.env.NODE_ENV === 'development' ||
    process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF
  ) {
    logError(`Error in ${studioMethod}:`, errorToReport)

    return
  }

  let errorObject: Error

  if (!(errorToReport instanceof Error)) {
    // Use safe serialization that handles circular references and other edge cases
    const message = exception.safeErrorSerialize(errorToReport)

    errorObject = new Error(message)
  } else {
    errorObject = errorToReport
  }

  let studioMethodArgsString: string | undefined

  if (studioMethodArgs) {
    try {
      studioMethodArgsString = JSON.stringify({
        args: studioMethodArgs,
      })
    } catch (e: unknown) {
      studioMethodArgsString = `Unknown args: ${e}`
    }
  }

  try {
    const payload: StudioErrorPayload = {
      studioHash,
      projectSlug,
      errors: [{
        name: stripPath(errorObject.name ?? `Unknown name`),
        stack: stripPath(errorObject.stack ?? `Unknown stack`),
        message: stripPath(errorObject.message ?? `Unknown message`),
        code: 'code' in errorObject ? errorObject.code as string | number : undefined,
        errno: 'errno' in errorObject ? errorObject.errno as string | number : undefined,
        studioMethod,
        studioMethodArgs: studioMethodArgsString ? stripPath(studioMethodArgsString) : undefined,
      }],
    }

    cloudApi.CloudRequest.post(
      `${cloudApi.cloudUrl}/studio/errors`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          ...cloudApi.cloudHeaders,
        },
      },
    ).catch((e: unknown) => {
      debug(
        `Error calling StudioManager.reportError: %o, original error %o`,
        e,
        error,
      )
    })
  } catch (e: unknown) {
    debug(
      `Error calling StudioManager.reportError: %o, original error %o`,
      e,
      error,
    )
  }
}
