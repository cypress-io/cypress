import _ from 'lodash'
import concatStream from 'concat-stream'
import debugModule from 'debug'
import { IncomingMessage, ServerResponse } from 'http'
import minimatch from 'minimatch'
import { PassThrough, Readable } from 'stream'
import Throttle from 'throttle'
import url from 'url'
import zlib from 'zlib'
// TODO: figure out the right way to make these types accessible in server and driver
import {
  NetEventFrames,
  AnnotatedRouteMatcherOptions,
  DICT_STRING_MATCHER_FIELDS,
  STRING_MATCHER_FIELDS,
  SERIALIZABLE_REQ_PROPS,
  SERIALIZABLE_RES_PROPS,
} from '../../driver/src/cy/commands/net_stubbing'
import {
  CyHttpMessages,
  RouteMatcherOptions,
  StaticResponse,
} from '../../../cli/types/cy-net-stubbing'

interface BackendRoute {
  routeMatcher: RouteMatcherOptions
  handlerId?: string
  staticResponse?: StaticResponse
}

export interface ProxyIncomingMessage extends IncomingMessage {
  proxiedUrl: string
  webSocket: boolean // TODO: populate
  requestId: string
  body?: string
}

interface BackendRequest {
  requestId: string
  /**
   * The route that matched this request.
   */
  route: BackendRoute
  /**
   * A callback that can be used to make the request go outbound.
   */
  continueRequest: Function
  /**
   * A callback that can be used to send the response through the proxy.
   */
  continueResponse?: Function
  req: ProxyIncomingMessage
  res: ServerResponse & { body?: string | any }
  incomingRes?: IncomingMessage
  resStream?: any
  /**
   * Should the response go to the driver, or should it be allowed to continue?
   */
  sendResponseToDriver?: boolean
}

const debug = debugModule('cypress:server:net_stubbing')

let routes : BackendRoute[] = []

// map of request IDs to requests in flight
let requests : { [key: string]: BackendRequest } = {}

function _getAllStringMatcherFields (options) {
  return _.concat(
    _.filter(STRING_MATCHER_FIELDS, _.partial(_.has, options)),
    // add the nested DictStringMatcher values to the list of fields
    _.flatten(
      _.filter(
        DICT_STRING_MATCHER_FIELDS.map((field) => {
          const value = options[field]

          if (value) {
            return _.keys(value).map((key) => {
              return `${field}.${key}`
            })
          }

          return ''
        })
      )
    )
  )
}

function _isResGzipped (res: IncomingMessage) {
  return res.headers['content-encoding'] === 'gzip'
}

function _restoreMatcherOptionsTypes (options: AnnotatedRouteMatcherOptions) {
  const stringMatcherFields = _getAllStringMatcherFields(options)

  const ret : RouteMatcherOptions = {}

  stringMatcherFields.forEach((field) => {
    const obj = _.get(options, field)

    if (obj) {
      _.set(ret, field, obj.type === 'regex' ? new RegExp(obj.value) : obj.value)
    }
  })

  const noAnnotationRequiredFields = ['https', 'port', 'webSocket']

  _.extend(ret, _.pick(options, noAnnotationRequiredFields))

  return ret
}

function _onRouteAdded (options: NetEventFrames.AddRoute) {
  const routeMatcher = _restoreMatcherOptionsTypes(options.routeMatcher)

  debug('adding route %o', { routeMatcher, options })

  routes.push({
    routeMatcher,
    ..._.omit(options, 'routeMatcher'),
  })
}

function _getRouteForRequest (req: ProxyIncomingMessage, prevRoute?: BackendRoute) {
  const possibleRoutes = prevRoute ? routes.slice(_.findIndex(routes, prevRoute) + 1) : routes

  return _.find(possibleRoutes, (route) => {
    return _doesRouteMatch(route.routeMatcher, req)
  })
}

export function _getMatchableForRequest (req: ProxyIncomingMessage) {
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

/**
 * Returns `true` if `req` matches all supplied properties on `routeMatcher`, `false` otherwise.
 */
// TOOD: optimize to short-circuit on route not match
export function _doesRouteMatch (routeMatcher: RouteMatcherOptions, req: ProxyIncomingMessage) {
  const matchable = _getMatchableForRequest(req)

  let match = true

  // get a list of all the fields which exist where a rule needs to be succeed
  const stringMatcherFields = _getAllStringMatcherFields(routeMatcher)
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

function _emit (socket: any, eventName: string, data: any) {
  debug('sending event to driver %o', { eventName, data })
  socket.toDriver('net:event', eventName, data)
}

function _sendStaticResponse (res: ServerResponse, staticResponse: StaticResponse, resStream?: Readable) {
  if (staticResponse.destroySocket) {
    res.connection.destroy()
    res.destroy()

    return
  }

  const statusCode = staticResponse.statusCode || 200
  const headers = staticResponse.headers

  res.writeHead(statusCode, headers || {})

  res.flushHeaders()

  if (resStream) {
    // ignore staticResponse.body
    return resStream.pipe(res)
  }

  if (staticResponse.body) {
    res.write(staticResponse.body)
  }

  res.end()
}

export function reset () {
  debug('resetting net_stubbing state')

  // clean up requests that are still pending
  for (const requestId in requests) {
    const request = requests[requestId]

    // TODO: try/catch?
    request.res.removeAllListeners('finish')
    request.res.removeAllListeners('error')
    request.res.on('error', _.noop)
    request.res.destroy()
  }

  requests = {}
  routes = []
}

export function onDriverEvent (socket: any, eventName: string, ...args: any[]) {
  debug('received driver event %o', { eventName, args })

  switch (eventName) {
    case 'route:added':
      _onRouteAdded(<NetEventFrames.AddRoute>args[0])
      break
    case 'http:request:continue':
      _onRequestContinue(<NetEventFrames.HttpRequestContinue>args[0], socket)
      break
    case 'http:response:continue':
      _onResponseContinue(<NetEventFrames.HttpResponseContinue>args[0])
      break
    case 'ws:connect:continue':
      break
    case 'ws:frame:outgoing:continue':
      break
    case 'ws:frame:incoming:continue':
      break
    default:
  }
}

/**
 * Called when a new request is received in the proxy layer.
 * @param project
 * @param req
 * @param res
 * @param cb Can be called to resume the proxy's normal behavior. If `res` is not handled and this is not called, the request will hang.
 */
export function onProxiedRequest (project: any, req: ProxyIncomingMessage, res: ServerResponse, cb: Function) {
  const route = _getRouteForRequest(req)

  try {
    return _onProxiedRequest(route, project.server._socket, req, res, cb)
  } catch (err) {
    debug('error in onProxiedRequest: %o', { err, req, res, routes })
  }
}

function _onProxiedRequest (route: BackendRoute | undefined, socket: any, req: ProxyIncomingMessage, res: ServerResponse, cb: Function) {
  if (!route) {
    // not intercepted, carry on normally...
    return cb()
  }

  const requestId = _.uniqueId('interceptedRequest')
  const frame : NetEventFrames.HttpRequestReceived = {
    routeHandlerId: route.handlerId!,
    requestId,
    req: _.extend(_.pick(req, SERIALIZABLE_REQ_PROPS), {
      url: req.proxiedUrl,
    }) as CyHttpMessages.IncomingRequest,
    notificationOnly: !!route.staticResponse,
  }

  function emit () {
    _emit(socket, 'http:request:received', frame)
  }

  const request : BackendRequest = {
    requestId,
    route,
    continueRequest: cb,
    req,
    res,
  }

  // attach requestId to the original req object for later use
  req.requestId = requestId

  requests[requestId] = request

  res.once('finish', () => {
    _emit(socket, 'http:request:complete', {
      requestId,
      routeHandlerId: route.handlerId!,
    })

    debug('request/response finished, cleaning up %o', { requestId })
    delete requests[requestId]
  })

  if (route.staticResponse) {
    emit()
    _sendStaticResponse(res, route.staticResponse)

    return // don't call cb since we've satisfied the response here
  }

  // if we already have a body, just emit
  if (frame.req.body) {
    return emit()
  }

  // else, buffer the body
  req.pipe(concatStream((reqBody) => {
    frame.req.body = reqBody.toString()
    emit()
  }))
}

function _onRequestContinue (frame: NetEventFrames.HttpRequestContinue, socket: any) {
  const backendRequest = requests[frame.requestId]

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
    const prevRoute = _.find(routes, { handlerId: frame.routeHandlerId })

    if (!prevRoute) {
      // route no longer registered, it's fine
      return backendRequest.continueRequest()
    }

    const nextRoute = _getRouteForRequest(backendRequest.req, prevRoute)

    return _onProxiedRequest(nextRoute, socket, backendRequest.req, backendRequest.res, backendRequest.continueRequest)
  }

  if (frame.staticResponse) {
    _sendStaticResponse(backendRequest.res, frame.staticResponse)

    return
  }

  backendRequest.continueRequest()
}

export function onProxiedResponseError (project: any, req: ProxyIncomingMessage, error: Error, cb: Function) {
  const backendRequest = requests[req.requestId]

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

  _emit(project.server._socket, 'http:response:received', frame)
}

export function onProxiedResponse (project: any, req: ProxyIncomingMessage, resStream: Readable, incomingRes: IncomingMessage, cb: Function) {
  try {
    return _onProxiedResponse(project, req, resStream, incomingRes, cb)
  } catch (err) {
    debug('error in onProxiedResponse: %o', { err, req, resStream, incomingRes, routes })
  }
}

function _onProxiedResponse (project: any, req: ProxyIncomingMessage, resStream: Readable, incomingRes: IncomingMessage, cb: Function) {
  const backendRequest = requests[req.requestId]

  debug('onProxiedResponse %o', { req, backendRequest })

  if (!backendRequest || !backendRequest.sendResponseToDriver) {
    // either the original request was not intercepted, or there's nothing for the driver to do with this response
    return cb(resStream)
  }

  // this may get set back to `true` by another route
  backendRequest.sendResponseToDriver = false
  backendRequest.incomingRes = incomingRes
  backendRequest.resStream = resStream
  backendRequest.continueResponse = cb

  const frame : NetEventFrames.HttpResponseReceived = {
    routeHandlerId: backendRequest.route.handlerId!,
    requestId: backendRequest.requestId,
    res: _.extend(_.pick(incomingRes, SERIALIZABLE_RES_PROPS), {
      url: req.proxiedUrl,
    }) as CyHttpMessages.IncomingResponse,
  }

  const res = frame.res as CyHttpMessages.IncomingResponse

  function emit () {
    _emit(project.server._socket, 'http:response:received', frame)
  }

  resStream.pipe(concatStream((resBody) => {
    // @ts-ignore
    if (_isResGzipped(incomingRes)) {
      return zlib.gunzip(resBody, (err, extracted) => {
        // TODO: handle encoding errors or just pass it on?
        res.body = extracted.toString()
        emit()
      })
    }

    res.body = resBody.toString()
    emit()
  }))
}

function _onResponseContinue (frame: NetEventFrames.HttpResponseContinue) {
  const backendRequest = requests[frame.requestId]

  if (typeof backendRequest === 'undefined') {
    return
  }

  const { res } = backendRequest

  debug('_onResponseContinue %o', { backendRequest: _.omit(backendRequest, 'res.body'), frame: _.omit(frame, 'res.body') })

  debug({
    // 'first 10 chars of backendRequest.res.body': backendRequest.res.body.slice(0, 10),
    'first 10 chars of frame.res.body': _.get(frame, 'res.body', '').slice(0, 10),
  })

  function continueResponse () {
    function throttleify (body) {
      const throttleStr = new Throttle(frame.throttleKbps! * 1024)

      throttleStr.write(body)
      throttleStr.end()

      return throttleStr
    }

    if (frame.staticResponse) {
      if (frame.throttleKbps) {
        return _sendStaticResponse(res, frame.staticResponse, throttleify(frame.staticResponse.body))
      }

      return _sendStaticResponse(res, frame.staticResponse)
    }

    // merge the changed response attributes with our response and continue
    _.assign(res, _.pick(frame.res, SERIALIZABLE_RES_PROPS))

    function sendBody (bodyBuffer) {
      // transform the body string into stream format
      if (frame.throttleKbps) {
        backendRequest.resStream = throttleify(bodyBuffer)
      } else {
        const pt = new PassThrough()

        pt.write(bodyBuffer)
        pt.end()

        backendRequest.resStream = pt
      }

      // TODO: this won't quite work for onProxiedResponseError?
      // @ts-ignore
      backendRequest.continueResponse(backendRequest.resStream)
    }

    // regzip, if it should be
    if (_isResGzipped(backendRequest.incomingRes)) {
      return zlib.gzip(res.body, (err, body) => {
        sendBody(body)
      })
    }

    sendBody(res.body)
  }

  if (typeof frame.continueResponseAt === 'number') {
    const delayMs = frame.continueResponseAt - Date.now()

    if (delayMs > 0) {
      return setTimeout(continueResponse, delayMs)
    }
  }

  return continueResponse()
}
