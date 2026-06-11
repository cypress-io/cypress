import { asyncRetry, linearDelay } from '../../../util/async_retry'
import { isRetryableError } from '../../network/is_retryable_error'
import { ParseKinds, postFetch } from '../../network/fetch'
import { getStandardHeaders } from '../get_standard_headers'

const routes = require('../../routes') as typeof import('../../routes')

interface PostStudioSessionOptions {
  projectId?: string
}

const _delay = linearDelay(500)

export const postStudioSession = async ({ projectId }: PostStudioSessionOptions) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(await getStandardHeaders()),
  }

  return await (asyncRetry(() => {
    return postFetch<{ studioUrl: string, protocolUrl: string }>(routes.apiRoutes.studioSession(), {
      parse: ParseKinds.JSON,
      headers,
      body: JSON.stringify({ projectSlug: projectId, studioMountVersion: 1, protocolMountVersion: 2 }),
    })
  }, {
    maxAttempts: 3,
    retryDelay: _delay,
    shouldRetry: (err) => isRetryableError(err, 'POST'),
  }))()
}
