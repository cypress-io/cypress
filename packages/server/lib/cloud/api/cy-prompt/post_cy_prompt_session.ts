import { asyncRetry, linearDelay } from '../../../util/async_retry'
import { isRetryableError } from '../../network/is_retryable_error'
import os from 'os'
import { ParseKinds, postFetch } from '../../network/fetch'

const pkg = require('@packages/root')
const routes = require('../../routes') as typeof import('../../routes')

interface PostCyPromptSessionOptions {
  projectId?: string
}

const _delay = linearDelay(500)

export const postCyPromptSession = async ({ projectId }: PostCyPromptSessionOptions) => {
  return await (asyncRetry(() => {
    return postFetch<{ cyPromptUrl: string }>(routes.apiRoutes.cyPromptSession(), {
      parse: ParseKinds.JSON,
      headers: {
        'Content-Type': 'application/json',
        'x-os-name': os.platform(),
        'x-cypress-version': pkg.version,
      },
      body: JSON.stringify({ projectSlug: projectId, cyPromptMountVersion: 2 }),
    })
  }, {
    maxAttempts: 3,
    retryDelay: _delay,
    shouldRetry: isRetryableError,
  }))()
}
