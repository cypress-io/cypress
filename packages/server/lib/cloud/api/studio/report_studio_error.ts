import type { StudioCloudApi } from '@packages/types/src/studio/studio-server-types'
import Debug from 'debug'
import { stripPath } from '../../strip_path'

const debug = Debug('cypress:server:cloud:api:studio:report_studio_errors')

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

  // When developing locally, we want to throw the error so we can see it in the console
  if (process.env.CYPRESS_LOCAL_STUDIO_PATH) {
    throw error
  }

  let errorObject: Error

  if (!(error instanceof Error)) {
    errorObject = new Error(String(error))
  } else {
    errorObject = error
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
        studioMethod,
        studioMethodArgs: studioMethodArgsString,
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
