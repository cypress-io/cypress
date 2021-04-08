import _ from 'lodash'
import { concatStream } from '@packages/network'
import Debug from 'debug'
import url from 'url'
import { getEncoding } from 'istextorbinary'

import {
  RequestMiddleware,
} from '@packages/proxy'
import {
  CyHttpMessages,
  SERIALIZABLE_REQ_PROPS,
} from '../../types'
import { getRouteForRequest, matchesRoutePreflight } from '../route-matching'
import {
  sendStaticResponse,
  setDefaultHeaders,
  mergeDeletedHeaders,
} from '../util'
import { InterceptedRequest } from '../intercepted-request'
import { BackendRoute } from '../types'

const debug = Debug('cypress:net-stubbing:server:intercept-request')

/**
 * Called when a new request is received in the proxy layer.
 */
export const InterceptRequest: RequestMiddleware = async function () {
  if (matchesRoutePreflight(this.netStubbingState.routes, this.req)) {
    // send positive CORS preflight response
    return sendStaticResponse(this, {
      statusCode: 204,
      headers: {
        'access-control-max-age': '-1',
        'access-control-allow-credentials': 'true',
        'access-control-allow-origin': this.req.headers.origin || '*',
        'access-control-allow-methods': this.req.headers['access-control-request-method'] || '*',
        'access-control-allow-headers': this.req.headers['access-control-request-headers'] || '*',
      },
    })
  }

  const matchingRoutes: BackendRoute[] = []

  const populateMatchingRoutes = (prevRoute?) => {
    const route = getRouteForRequest(this.netStubbingState.routes, this.req, prevRoute)

    if (!route) {
      return
    }

    matchingRoutes.push(route)

    populateMatchingRoutes(route)
  }

  populateMatchingRoutes()

  if (!matchingRoutes.length) {
    // not intercepted, carry on normally...
    return this.next()
  }

  const request = new InterceptedRequest({
    continueRequest: this.next,
    onError: this.onError,
    onResponse: (incomingRes, resStream) => {
      setDefaultHeaders(this.req, incomingRes)
      this.onResponse(incomingRes, resStream)
    },
    req: this.req,
    res: this.res,
    socket: this.socket,
    state: this.netStubbingState,
    matchingRoutes,
  })

  debug('intercepting request %o', { requestId: request.id, req: _.pick(this.req, 'url') })

  // attach requestId to the original req object for later use
  this.req.requestId = request.id

  this.netStubbingState.requests[request.id] = request

  const req = _.extend(_.pick(request.req, SERIALIZABLE_REQ_PROPS), {
    url: request.req.proxiedUrl,
  }) as CyHttpMessages.IncomingRequest

  request.res.once('finish', async () => {
    request.handleSubscriptions<CyHttpMessages.ResponseComplete>({
      eventName: 'after:response',
      data: request.includeBodyInAfterResponse ? {
        finalResBody: request.res.body!,
      } : {},
      mergeChanges: _.noop,
    })

    debug('request/response finished, cleaning up %o', { requestId: request.id })
    delete this.netStubbingState.requests[request.id]
  })

  const ensureBody = () => {
    return new Promise<void>((resolve) => {
      if (req.body) {
        return resolve()
      }

      request.req.pipe(concatStream((reqBody) => {
        req.body = reqBody
        resolve()
      }))
    })
  }

  await ensureBody()

  if (!_.isString(req.body) && !_.isBuffer(req.body)) {
    throw new Error('req.body must be a string or a Buffer')
  }

  if (getEncoding(req.body) !== 'binary') {
    req.body = req.body.toString('utf8')
  }

  request.req.body = req.body

  const mergeChanges = (before: CyHttpMessages.IncomingRequest, after: CyHttpMessages.IncomingRequest) => {
    if (before.headers['content-length'] === after.headers['content-length']) {
      // user did not purposely override content-length, let's set it
      after.headers['content-length'] = String(Buffer.from(after.body).byteLength)
    }

    // resolve and propagate any changes to the URL
    request.req.proxiedUrl = after.url = url.resolve(request.req.proxiedUrl, after.url)

    _.merge(before, _.pick(after, SERIALIZABLE_REQ_PROPS))

    mergeDeletedHeaders(before, after)
  }

  const modifiedReq = await request.handleSubscriptions<CyHttpMessages.IncomingRequest>({
    eventName: 'before:request',
    data: req,
    mergeChanges,
  })

  mergeChanges(req, modifiedReq)
  // @ts-ignore
  mergeChanges(request.req, req)

  return request.continueRequest()
}
