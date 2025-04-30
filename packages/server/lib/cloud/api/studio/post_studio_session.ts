import { asyncRetry, linearDelay } from '../../../util/async_retry'
import { isRetryableError } from '../../network/is_retryable_error'
import fetch from 'cross-fetch'
import os from 'os'
import { agent } from '@packages/network'

const pkg = require('@packages/root')
const routes = require('../../routes') as typeof import('../../routes')

interface GetStudioSessionOptions {
  projectId?: string
}

const _delay = linearDelay(500)

export const postStudioSession = async ({ projectId }: GetStudioSessionOptions) => {
  return await (asyncRetry(async () => {
    const response = await fetch(routes.apiRoutes.studioSession(), {
      // @ts-expect-error - this is supported
      agent,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-os-name': os.platform(),
        'x-cypress-version': pkg.version,
      },
      body: JSON.stringify({ projectSlug: projectId, studioMountVersion: 1, protocolMountVersion: 2 }),
    })

    if (!response.ok) {
      throw new Error('Failed to create studio session')
    }

    const data = await response.json()

    return {
      studioUrl: data.studioUrl,
      protocolUrl: data.protocolUrl,
    }
  }, {
    maxAttempts: 3,
    retryDelay: _delay,
    shouldRetry: isRetryableError,
  }))()
}
