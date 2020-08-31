import _ from 'lodash'
import concatStream from 'concat-stream'
import Debug from 'debug'
import minimatch from 'minimatch'
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
  RouteMatcherOptions,
  CyHttpMessages,
  NetEventFrames,
  SERIALIZABLE_REQ_PROPS,
} from '../types'
import { getAllStringMatcherFields, sendStaticResponse, emit, setBodyFromFixture } from './util'
import CyServer from '@packages/server'

const debug = Debug('cypress:net-stubbing:server:intercept-request')

/**
 * Returns `true` if `req` matches all supplied properties on `routeMatcher`, `false` otherwise.
 */
// TOOD: optimize to short-circuit on route not match
export function _doesRouteMatch (routeMatcher: RouteMatcherOptions, req: CypressIncomingRequest) {
  const matchable = _getMatchableForRequest(req)

  let match = true

  // get a list of all the fields which exist where a rule needs to be succeed
  const stringMatcherFields = getAllStringMatcherFields(routeMatcher)
  const booleanFields = _.filter(_.keys(routeMatcher), _.partial(_.includes, ['https', 'webSocket']))
  const numberFields = _.filter(_.keys(routeMatcher), _.partial(_.includes, ['port']))

  stringMatcherFields.forEach((field) => {
    const matcher = _.get(routeMatcher, field)
    let value = _.get(matchable, field, '')

    if (typeof value !== 'string') {
      value = String(value)
    }

    if (matcher.test) {
      // value is a regex
      match = match && matcher.test(value)

      return
    }

    if (field === 'url') {
      // for urls, check that it appears anywhere in the string
      if (value.includes(matcher)) {
        return
      }
    }

    match = match && minimatch(value, matcher, { matchBase: true })
  })

  booleanFields.forEach((field) => {
    const matcher = _.get(routeMatcher, field)
    const value = _.get(matchable, field)

    match = match && (matcher === value)
  })

  numberFields.forEach((field) => {
    const matcher = _.get(routeMatcher, field)
    const value = _.get(matchable, field)

    if (matcher.length) {
      // list of numbers, any one can match
      match = match && matcher.includes(value)

      return
    }

    match = match && (matcher === value)
  })

  return match
}

export function _getMatchableForRequest (req: CypressIncomingRequest) {
  let matchable: any = _.pick(req, ['headers', 'method', 'webSocket'])

  const authorization = req.headers['authorization']

  if (authorization) {
    const [mechanism, credentials] = authorization.split(' ', 2)

    if (mechanism && credentials && mechanism.toLowerCase() === 'basic') {
      const [username, password] = Buffer.from(credentials, 'base64').toString().split(':', 2)

      matchable.auth = { username, password }
    }
  }

  const proxiedUrl = url.parse(req.proxiedUrl, true)

  _.assign(matchable, _.pick(proxiedUrl, ['hostname', 'path', 'pathname', 'port', 'query']))

  matchable.url = req.proxiedUrl

  matchable.https = proxiedUrl.protocol && (proxiedUrl.protocol.indexOf('https') === 0)

  if (!matchable.port) {
    matchable.port = matchable.https ? 443 : 80
  }

  return matchable
}

function _getRouteForRequest (routes: BackendRoute[], req: CypressIncomingRequest, prevRoute?: BackendRoute) {
  const possibleRoutes = prevRoute ? routes.slice(_.findIndex(routes, prevRoute) + 1) : routes

  return _.find(possibleRoutes, (route) => {
    return _doesRouteMatch(route.routeMatcher, req)
  })
}

/**
 * Called when a new request is received in the proxy layer.
 * @param project
 * @param req
 * @param res
 * @param cb Can be called to resume the proxy's normal behavior. If `res` is not handled and this is not called, the request will hang.
 */
export const InterceptRequest: RequestMiddleware = function () {
  const route = _getRouteForRequest(this.netStubbingState.routes, this.req)

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
    onResponse: this.onResponse,
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

  if (route.staticResponse) {
    emitReceived()

    return sendStaticResponse(request.res, route.staticResponse, request.onResponse!)
  }

  if (notificationOnly) {
    emitReceived()

    const nextRoute = getNextRoute(state, request.req, frame.routeHandlerId)

    if (!nextRoute) {
      return request.continueRequest()
    }

    return _interceptRequest(state, request, nextRoute, socket)
  }

  // if we already have a body, just emit
  if (frame.req.body) {
    return emitReceived()
  }

  // else, buffer the body
  request.req.pipe(concatStream((reqBody) => {
    frame.req.body = reqBody.toString()
    emitReceived()
  }))
}

/**
 * If applicable, return the route that is next in line after `prevRouteHandlerId` to handle `req`.
 */
function getNextRoute (state: NetStubbingState, req: CypressIncomingRequest, prevRouteHandlerId: string): BackendRoute | undefined {
  const prevRoute = _.find(state.routes, { handlerId: prevRouteHandlerId })

  if (!prevRoute) {
    return
  }

  return _getRouteForRequest(state.routes, req, prevRoute)
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
  if (backendRequest.req.headers['content-length'] && frame.req.body) {
    backendRequest.req.headers['content-length'] = frame.req.body.length
  }

  if (frame.hasResponseHandler) {
    backendRequest.sendResponseToDriver = true
  }

  if (frame.tryNextRoute) {
    const nextRoute = getNextRoute(state, backendRequest.req, frame.routeHandlerId)

    if (!nextRoute) {
      return backendRequest.continueRequest()
    }

    return _interceptRequest(state, backendRequest, nextRoute, socket)
  }

  if (frame.staticResponse) {
    await setBodyFromFixture(backendRequest.route.getFixture, frame.staticResponse)

    return sendStaticResponse(backendRequest.res, frame.staticResponse, backendRequest.onResponse!)
  }

  backendRequest.continueRequest()
}
