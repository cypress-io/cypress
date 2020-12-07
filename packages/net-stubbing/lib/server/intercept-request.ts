import _ from 'lodash'
import { concatStream } from '@packages/network'
import Debug from 'debug'
import url from 'url'

import {
  CypressIncomingRequest,
  RequestMiddleware,
} from '@packages/proxy'
import {
  BackendRoute,
  BackendRequest,
  NetStubbingState,
} from './types'
import {
  CyHttpMessages,
  NetEventFrames,
  SERIALIZABLE_REQ_PROPS,
} from '../types'
import { getRouteForRequest } from './route-matching'
import {
  sendStaticResponse,
  emit,
  setResponseFromFixture,
  setDefaultHeaders,
} from './util'
import CyServer from '@packages/server'

const debug = Debug('cypress:net-stubbing:server:intercept-request')

/**
 * Called when a new request is received in the proxy layer.
 * @param project
 * @param req
 * @param res
 * @param cb Can be called to resume the proxy's normal behavior. If `res` is not handled and this is not called, the request will hang.
 */
export const InterceptRequest: RequestMiddleware = function () {
  const route = getRouteForRequest(this.netStubbingState.routes, this.req)

  if (!route) {
    // not intercepted, carry on normally...
    return this.next()
  }

  const requestId = _.uniqueId('interceptedRequest')

  debug('intercepting request %o', { requestId, route, req: _.pick(this.req, 'url') })

  const request: BackendRequest = {
    requestId,
    route,
    continueRequest: this.next,
    onResponse: (incomingRes, resStream) => {
      setDefaultHeaders(this.req, incomingRes)
      this.onResponse(incomingRes, resStream)
    },
    req: this.req,
    res: this.res,
  }

  // attach requestId to the original req object for later use
  this.req.requestId = requestId

  this.netStubbingState.requests[requestId] = request

  _interceptRequest(this.netStubbingState, request, route, this.socket)
}

function _interceptRequest (state: NetStubbingState, request: BackendRequest, route: BackendRoute, socket: CyServer.Socket) {
  const notificationOnly = !route.hasInterceptor

  const frame: NetEventFrames.HttpRequestReceived = {
    routeHandlerId: route.handlerId!,
    requestId: request.req.requestId,
    req: _.extend(_.pick(request.req, SERIALIZABLE_REQ_PROPS), {
      url: request.req.proxiedUrl,
    }) as CyHttpMessages.IncomingRequest,
    notificationOnly,
  }

  request.res.once('finish', () => {
    emit(socket, 'http:request:complete', {
      requestId: request.requestId,
      routeHandlerId: route.handlerId!,
    })

    debug('request/response finished, cleaning up %o', { requestId: request.requestId })
    delete state.requests[request.requestId]
  })

  const emitReceived = () => {
    emit(socket, 'http:request:received', frame)
  }

  const ensureBody = (cb: () => void) => {
    if (frame.req.body) {
      return cb()
    }

    request.req.pipe(concatStream((reqBody) => {
      request.req.body = frame.req.body = reqBody.toString()
      cb()
    }))
  }

  if (route.staticResponse) {
    const { staticResponse } = route

    return ensureBody(() => {
      emitReceived()
      sendStaticResponse(request.res, staticResponse, request.onResponse!)
    })
  }

  if (notificationOnly) {
    return ensureBody(() => {
      emitReceived()

      const nextRoute = getNextRoute(state, request.req, frame.routeHandlerId)

      if (!nextRoute) {
        return request.continueRequest()
      }

      _interceptRequest(state, request, nextRoute, socket)
    })
  }

  ensureBody(emitReceived)
}

/**
 * If applicable, return the route that is next in line after `prevRouteHandlerId` to handle `req`.
 */
function getNextRoute (state: NetStubbingState, req: CypressIncomingRequest, prevRouteHandlerId: string): BackendRoute | undefined {
  const prevRoute = _.find(state.routes, { handlerId: prevRouteHandlerId })

  if (!prevRoute) {
    return
  }

  return getRouteForRequest(state.routes, req, prevRoute)
}

export async function onRequestContinue (state: NetStubbingState, frame: NetEventFrames.HttpRequestContinue, socket: CyServer.Socket) {
  const backendRequest = state.requests[frame.requestId]

  if (!backendRequest) {
    debug('onRequestContinue received but no backendRequest exists %o', { frame })

    return
  }

  frame.req.url = url.resolve(backendRequest.req.proxiedUrl, frame.req.url)

  // modify the original paused request object using what the client returned
  _.assign(backendRequest.req, _.pick(frame.req, SERIALIZABLE_REQ_PROPS))

  // proxiedUrl is used to initialize the new request
  backendRequest.req.proxiedUrl = frame.req.url

  // update problematic headers
  // update content-length if available
  if (backendRequest.req.headers['content-length'] && frame.req.body != null) {
    backendRequest.req.headers['content-length'] = Buffer.from(frame.req.body).byteLength.toString()
  }

  if (frame.hasResponseHandler) {
    backendRequest.waitForResponseContinue = true
  }

  if (frame.tryNextRoute) {
    const nextRoute = getNextRoute(state, backendRequest.req, frame.routeHandlerId)

    if (!nextRoute) {
      return backendRequest.continueRequest()
    }

    return _interceptRequest(state, backendRequest, nextRoute, socket)
  }

  if (frame.staticResponse) {
    await setResponseFromFixture(backendRequest.route.getFixture, frame.staticResponse)

    return sendStaticResponse(backendRequest.res, frame.staticResponse, backendRequest.onResponse!)
  }

  backendRequest.continueRequest()
}
