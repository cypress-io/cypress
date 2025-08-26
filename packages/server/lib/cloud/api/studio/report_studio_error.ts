import type { StudioCloudApi } from '@packages/types/src/studio/studio-server-types'
import Debug from 'debug'
import { stripPath } from '../../strip_path'
const debug = Debug('cypress:server:cloud:api:studio:report_studio_errors')
import { logError } from '@packages/stderr-filtering'

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

  // When developing locally, do not send to Sentry, but instead log to console.
  if (
    process.env.CYPRESS_LOCAL_STUDIO_PATH ||
    process.env.NODE_ENV === 'development' ||
    process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF
  ) {
    logError(`Error in ${studioMethod}:`, error)

    return
  }

  let errorObject: Error

  if (!(error instanceof Error)) {
    // Properly serialize non-Error objects instead of using default toString()
    let errorMessage: string
    try {
      if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error)
      } else {
        errorMessage = String(error)
      }
    } catch {
      // Fallback if JSON.stringify fails (e.g., circular references)
      errorMessage = String(error)
    }
    errorObject = new Error(errorMessage)
  } else {
    errorObject = error
  }

  let studioMethodArgsString: string | undefined

  if (studioMethodArgs) {
    try {
      // Deep serialize arguments to avoid [object Object] issues
      const serializedArgs = studioMethodArgs.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
          try {
            return JSON.parse(JSON.stringify(arg))
          } catch {
            return String(arg)
          }
        }
        return arg
      })
      
      studioMethodArgsString = JSON.stringify({
        args: serializedArgs,
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
