import Debug from 'debug'

import type { ErrorMiddleware } from '@packages/proxy'

const debug = Debug('cypress:net-stubbing:server:intercept-error')

export const InterceptError: ErrorMiddleware = async function () {
  if (!this.req.hadIntercept) {
    return this.next()
  }

  if (this.onInterceptNetworkError) {
    await this.onInterceptNetworkError(this.req.requestId, this.error)
  }

  debug('network error for intercepted request %o', {
    req: this.req.proxiedUrl,
    error: this.error,
  })

  return this.next()
}
