import _ from 'lodash'
import concatStream from 'concat-stream'
import debugModule from 'debug'
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
import { getAllStringMatcherFields, sendStaticResponse, emit } from './util'
import CyServer from '@packages/server'

const debug = debugModule('cypress:net-stubbing:server:intercept-request')

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

  debug('does route match? %o', { match, routeMatcher, req: _.pick(matchable, _.concat(stringMatcherFields, booleanFields, numberFields)) })

  return match
}

export function _getMatchableForRequest (req: CypressIncomingRequest) {
  let matchable : any = _.pick(req, ['headers', 'method', 'webSocket'])

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
export const InterceptRequest : RequestMiddleware = function () {
  const route = _getRouteForRequest(this.netStubbingState.routes, this.req)

  if (!route) {
    // not intercepted, carry on normally...
    return this.next()
  }

  const requestId = _.uniqueId('interceptedRequest')

  const request : BackendRequest = {
    requestId,
    route,
    continueRequest: this.next,
    req: this.req,
    res: this.res,
  }

  // attach requestId to the original req object for later use
  this.req.requestId = requestId

  this.netStubbingState.requests[requestId] = request

  this.res.once('finish', () => {
    emit(this.socket, 'http:request:complete', {
      requestId,
      routeHandlerId: route.handlerId!,
    })

    debug('request/response finished, cleaning up %o', { requestId })
    delete this.netStubbingState.requests[requestId]
  })

  _interceptRequest(request, route, this.socket)
}

function _interceptRequest (request: BackendRequest, route: BackendRoute, socket: CyServer.Socket) {
  const emitReceived = () => {
    emit(socket, 'http:request:received', frame)
  }

  const frame : NetEventFrames.HttpRequestReceived = {
    routeHandlerId: route.handlerId!,
    requestId: request.req.requestId,
    req: _.extend(_.pick(request.req, SERIALIZABLE_REQ_PROPS), {
      url: request.req.proxiedUrl,
    }) as CyHttpMessages.IncomingRequest,
    notificationOnly: !!route.staticResponse,
  }

  if (route.staticResponse) {
    emitReceived()
    sendStaticResponse(request.res, route.staticResponse)

    return // don't call cb since we've satisfied the response here
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

export function onRequestContinue (state: NetStubbingState, frame: NetEventFrames.HttpRequestContinue, socket: CyServer.Socket) {
  const backendRequest = state.requests[frame.requestId]

  if (!backendRequest) {
    return
    // TODO
  }

  // modify the original paused request object using what the client returned
  _.assign(backendRequest.req, _.pick(frame.req, SERIALIZABLE_REQ_PROPS))

  // proxiedUrl is used to initialize the new request
  backendRequest.req.proxiedUrl = frame.req.url

  // update problematic headers
  // update content-length if available
  if (backendRequest.req.headers['content-length'] && frame.req.body) {
    backendRequest.req.headers['content-length'] = frame.req.body.length
  }

  // TODO: see if we should implement a way to override this
  // prevent cached responses from being received
  delete backendRequest.req.headers['if-none-match']

  if (frame.hasResponseHandler) {
    backendRequest.sendResponseToDriver = true
  }

  if (frame.tryNextRoute) {
    // outgoing request has been modified, now pass this to the next available route handler
    const prevRoute = _.find(state.routes, { handlerId: frame.routeHandlerId })

    if (!prevRoute) {
      // route no longer registered, it's fine
      return backendRequest.continueRequest()
    }

    const nextRoute = _getRouteForRequest(state.routes, backendRequest.req, prevRoute)

    if (!nextRoute) {
      return backendRequest.continueRequest()
    }

    // TODO: kind of an awkward API, might want to change
    return _interceptRequest(backendRequest, nextRoute, socket)
  }

  if (frame.staticResponse) {
    sendStaticResponse(backendRequest.res, frame.staticResponse)

    return
  }

  backendRequest.continueRequest()
}
