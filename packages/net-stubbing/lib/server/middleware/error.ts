import type { ErrorMiddleware } from '@packages/proxy'
import type { CyHttpMessages } from '../../types'
import _ from 'lodash'
import * as errors from '@packages/server/lib/errors'

// do not use a debug namespace in this file - use the per-request `request.debug` instead
// available as cypress-verbose:proxy:http
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const debug = null

export const InterceptError: ErrorMiddleware = async function () {
  const request = this.netStubbingState.requests[this.req.requestId]

  if (!request) {
    // the original request was not intercepted, nothing to do
    return this.next()
  }

  request.debug('intercepting error %o', { req: this.req, request })

  request.continueResponse = this.next

  await request.handleSubscriptions<CyHttpMessages.NetworkError>({
    eventName: 'network:error',
    data: {
      error: errors.cloneErr(this.error),
    },
    mergeChanges: _.noop,
  })

  this.next()
}
