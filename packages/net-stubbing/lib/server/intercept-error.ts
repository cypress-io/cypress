import debugModule from 'debug'

import { CypressIncomingRequest } from '@packages/proxy'
import { NetStubbingState } from './types'
import { NetEventFrames } from '../types'
import { emit } from './util'

const debug = debugModule('cypress:net-stubbing:server:intercept-error')

export function InterceptError (state: NetStubbingState, project: any, req: CypressIncomingRequest, error: Error, cb: Function) {
  const backendRequest = state.requests[req.requestId]

  debug('onProxiedResponseError %o', { req, backendRequest })

  if (!backendRequest || !backendRequest.sendResponseToDriver) {
    // either the original request was not intercepted, or there's nothing for the driver to do with this response
    return cb()
  }

  // this may get set back to `true` by another route
  backendRequest.sendResponseToDriver = false
  backendRequest.continueResponse = cb

  const frame : NetEventFrames.HttpResponseReceived = {
    routeHandlerId: backendRequest.route.handlerId!,
    requestId: backendRequest.requestId,
    res: {
      url: req.proxiedUrl,
      error,
    },
  }

  emit(project.server._socket, 'http:response:received', frame)
}
