import Debug from 'debug'

import { ErrorMiddleware } from '@packages/proxy'
import { NetEventFrames } from '../types'
import { emit } from './util'

const debug = Debug('cypress:net-stubbing:server:intercept-error')

export const InterceptError: ErrorMiddleware = function () {
  const backendRequest = this.netStubbingState.requests[this.req.requestId]

  if (!backendRequest || !backendRequest.sendResponseToDriver) {
    // either the original request was not intercepted, or there's nothing for the driver to do with this response
    return this.next()
  }

  debug('intercepting error %o', { req: this.req, backendRequest })

  // this may get set back to `true` by another route
  backendRequest.sendResponseToDriver = false
  backendRequest.continueResponse = this.next

  const frame: NetEventFrames.HttpResponseReceived = {
    routeHandlerId: backendRequest.route.handlerId!,
    requestId: backendRequest.requestId,
    res: {
      headers: {},
      url: this.req.proxiedUrl,
      error: this.error,
    },
  }

  emit(this.socket, 'http:response:received', frame)
}
