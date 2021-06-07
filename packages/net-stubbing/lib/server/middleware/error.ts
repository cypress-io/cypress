import Debug from 'debug'

import { ErrorMiddleware } from '@packages/proxy'
import { CyHttpMessages } from '../../types'
import _ from 'lodash'
import errors from '@packages/server/lib/errors'

const debug = Debug('cypress:net-stubbing:server:intercept-error')

export const InterceptError: ErrorMiddleware = async function () {
  const request = this.netStubbingState.requests[this.req.requestId]

  if (!request) {
    // the original request was not intercepted, nothing to do
    return this.next()
  }

  debug('intercepting error %o', { req: this.req, request })

  request.continueResponse = this.next

  await request.handleSubscriptions<CyHttpMessages.NetworkError>({
    eventName: 'network:error',
    data: {
      error: errors.clone(this.error),
    },
    mergeChanges: _.noop,
  })

  this.next()
}
