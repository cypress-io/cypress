import _ from 'lodash'
import { concatStream } from '@packages/network'
import Debug from 'debug'
import url from 'url'
import { getEncoding } from 'istextorbinary'

import {
  RequestMiddleware,
} from '@packages/proxy'
import {
  BackendRequest,
} from './types'
import {
  CyHttpMessages,
  SERIALIZABLE_REQ_PROPS,
} from '../types'
import { getRouteForRequest, matchesRoutePreflight } from './route-matching'
import {
  sendStaticResponse,
  emit,
  setDefaultHeaders,
} from './util'
import { Subscription } from '../external-types'
import { NetEvent } from '../internal-types'

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

  let route; let lastRoute
  const subscriptions: Subscription[] = []

  while ((route = getRouteForRequest(this.netStubbingState.routes, this.req, route))) {
    Array.prototype.push.apply(subscriptions, [{
      eventName: 'before-request',
      // req.reply callback?
      await: !!route.hasInterceptor,
      routeHandlerId: route.handlerId,
    }, {
      eventName: 'response',
      // notification-only
      await: false,
      routeHandlerId: route.handlerId,
    }, {
      eventName: 'response-complete',
      // notification-only
      await: false,
      routeHandlerId: route.handlerId,
    }])

    lastRoute = route
  }

  console.log('SUBS', subscriptions)

  if (!subscriptions.length || !lastRoute) {
    console.log('NEXTING')

    // not intercepted, carry on normally...
    return this.next()
  }

  const requestId = _.uniqueId('interceptedRequest')

  debug('intercepting request %o', { requestId, req: _.pick(this.req, 'url') })

  const request: BackendRequest = {
    requestId,
    continueRequest: this.next,
    onError: this.onError,
    onResponse: (incomingRes, resStream) => {
      setDefaultHeaders(this.req, incomingRes)
      this.onResponse(incomingRes, resStream)
    },
    req: this.req,
    res: this.res,
    subscriptions,
    handleSubscriptions: async ({ eventName, data, mergeChanges }) => {
      console.log('HANDLING', eventName)
      const handleSubscription = async (subscription: Subscription) => {
        const eventId = _.uniqueId('Event')
        const eventFrame: NetEvent.ToDriver.Event<any> = {
          eventId,
          subscription,
          requestId: request.requestId,
          routeHandlerId: subscription.routeHandlerId,
          data,
        }

        const _emit = () => emit(this.socket, eventName, eventFrame)

        if (!subscription.await) {
          _emit()

          return data
        }

        const p = new Promise((resolve) => {
          this.netStubbingState.pendingEventHandlers[eventId] = resolve
        })

        _emit()

        const changedData = await p

        console.log('GOT CHANGED DATA!', changedData)

        return mergeChanges(data, changedData as any)
      }

      let lastI = -1

      const getNextSubscription = () => {
        return _.find(request.subscriptions, (v, i) => {
          if (i > lastI && v.eventName === eventName) {
            lastI = i

            return v
          }

          return
        }) as Subscription | undefined
      }

      let subscription: Subscription | undefined

      while ((subscription = getNextSubscription())) {
        data = await handleSubscription(subscription)
      }

      return data
    },
  }

  // attach requestId to the original req object for later use
  this.req.requestId = requestId

  this.netStubbingState.requests[requestId] = request

  const req = _.extend(_.pick(request.req, SERIALIZABLE_REQ_PROPS), {
    url: request.req.proxiedUrl,
  }) as CyHttpMessages.IncomingRequest

  console.log('REQ CREATED')
  request.res.once('finish', async () => {
    request.handleSubscriptions<CyHttpMessages.ResponseComplete>({
      eventName: 'response-complete',
      data: {},
      mergeChanges: _.identity,
    })

    debug('request/response finished, cleaning up %o', { requestId: request.requestId })
    delete this.netStubbingState.requests[request.requestId]
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

  console.log('AFTER ENSUREBODY', req.body)

  const mergeChanges = (before: CyHttpMessages.IncomingRequest, after: CyHttpMessages.IncomingRequest) => {
    if (before.headers['content-length'] === after.headers['content-length']) {
      // user did not purposely override content-length, let's set it
      after.headers['content-length'] = String(Buffer.from(after.body).byteLength)
    }

    // resolve and propagate any changes to the URL
    request.req.proxiedUrl = after.url = url.resolve(request.req.proxiedUrl, after.url)

    return _.merge(before, _.pick(after, SERIALIZABLE_REQ_PROPS))
  }

  const modifiedReq = await request.handleSubscriptions<CyHttpMessages.IncomingRequest>({
    eventName: 'before-request',
    data: req,
    mergeChanges,
  })

  console.log('AFTER HANDLESUBSCRIPTIONS')

  if (lastRoute.staticResponse) {
    console.log('LASTROUTE HAS STATICRESPONSE')

    return sendStaticResponse(request, lastRoute.staticResponse)
  }

  mergeChanges(req, modifiedReq)
  mergeChanges(request.req, req)

  return request.continueRequest()
}
