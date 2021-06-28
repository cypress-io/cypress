import _ from 'lodash'

import {
  Route,
  Interception,
  CyHttpMessages,
  SERIALIZABLE_REQ_PROPS,
  Subscription,
} from '../types'
import { parseJsonBody, stringifyJsonBody } from './utils'
import {
  validateStaticResponse,
  parseStaticResponseShorthand,
} from '../static-response-utils'
import $errUtils from '../../../cypress/error_utils'
import { HandlerFn, HandlerResult } from '.'
import Bluebird from 'bluebird'
import { NetEvent } from '@packages/net-stubbing/lib/types'
import Debug from 'debug'

const debug = Debug('cypress:driver:net-stubbing:events:before-request')

type Result = HandlerResult<CyHttpMessages.IncomingRequest>

const validEvents = ['before:response', 'response', 'after:response']

const getDisplayUrl = (url: string) => {
  if (url.startsWith(window.location.origin)) {
    return url.slice(window.location.origin.length)
  }

  return url
}

export const onBeforeRequest: HandlerFn<CyHttpMessages.IncomingRequest> = (Cypress, frame, userHandler, { getRoute, getRequest, emitNetEvent, sendStaticResponse }) => {
  function getRequestLog (route: Route, request: Omit<Interception, 'log'>) {
    const message = _.compact([
      request.request.method,
      request.response && request.response.statusCode,
      getDisplayUrl(request.request.url),
      request.state,
    ]).join(' ')

    const displayName = route.handler ? (_.isFunction(route.handler) ? 'req fn' : 'req stub') : 'req'

    return Cypress.log({
      name: 'xhr',
      displayName,
      alias: route.alias,
      aliasType: 'route',
      type: 'parent',
      event: true,
      method: request.request.method,
      timeout: undefined,
      consoleProps: () => {
        return {
          Alias: route.alias,
          Method: request.request.method,
          URL: request.request.url,
          Matched: route.options,
          Handler: route.handler,
        }
      },
      renderProps: () => {
        return {
          indicator: request.state === 'Complete' ? 'successful' : 'pending',
          message,
        }
      },
    })
  }

  const { data: req, requestId, subscription } = frame
  const { routeId } = subscription
  const route = getRoute(routeId)

  const bodyParsed = parseJsonBody(req)

  const subscribe = (eventName, handler) => {
    const subscription: Subscription = {
      id: _.uniqueId('Subscription'),
      routeId,
      eventName,
      await: true,
    }

    request.subscriptions.push({
      subscription,
      handler,
    })

    debug('created request subscription %o', { eventName, request, subscription, handler })

    emitNetEvent('subscribe', { requestId, subscription } as NetEvent.ToServer.Subscribe)
  }

  const getCanonicalRequest = (): Interception => {
    const existingRequest = getRequest(routeId, requestId)

    if (existingRequest) {
      existingRequest.request = req

      return existingRequest
    }

    return {
      id: requestId,
      routeId,
      request: req,
      state: 'Received',
      requestWaited: false,
      responseWaited: false,
      subscriptions: [],
    }
  }

  const request: Interception = getCanonicalRequest()

  let resolved = false
  let handlerCompleted = false

  const createQueryObject = () => {
    try {
      if (/^(?:[a-z]+:)?\/\//i.test(req.url) === false) {
        const { protocol, hostname, port } = window.location

        req.url = `${protocol}//${hostname}${port ? `:${port}` : ''}${req.url}`
      }

      const url = new URL(req.url)
      const urlSearchParams = new URLSearchParams(url.search)
      const result = {}

      for (let pair of urlSearchParams.entries()) {
        result[pair[0]] = pair[1]
      }

      return result
    } catch { // avoid when url is "".
      return {}
    }
  }

  const updateUrlParams = (paramsObj) => {
    const url = new URL(req.url)
    const urlSearchParams = new URLSearchParams(paramsObj)

    url.search = urlSearchParams.toString()
    req.url = url.toString()
  }

  const createQueryProxy = (obj) => {
    return new Proxy(obj, {
      set (target, key, value) {
        target[key] = value

        updateUrlParams(target)

        return true
      },

      deleteProperty (target, key) {
        delete target[key]

        updateUrlParams(target)

        return true
      },

      defineProperty () {
        $errUtils.throwErrByPath('net_stubbing.request_handling.defineproperty_is_not_allowed')

        return false
      },

      setPrototypeOf () {
        $errUtils.throwErrByPath('net_stubbing.request_handling.setprototypeof_is_not_allowed')

        return false
      },
    })
  }

  let queryObj = createQueryObject()
  let queryProxy = createQueryProxy(queryObj)

  const userReq: CyHttpMessages.IncomingHttpRequest = {
    ...req,
    get query () {
      return queryProxy
    },
    set query (userQuery) {
      updateUrlParams(userQuery)
      queryProxy = createQueryProxy(userQuery)
    },
    get url () {
      return req.url
    },
    set url (userUrl) {
      req.url = userUrl

      // reset query variables
      queryObj = createQueryObject()
      queryProxy = createQueryProxy(queryObj)
    },
    on (eventName, handler) {
      if (!validEvents.includes(eventName)) {
        return $errUtils.throwErrByPath('net_stubbing.request_handling.unknown_event', {
          args: {
            validEvents,
            eventName,
          },
        })
      }

      if (!_.isFunction(handler)) {
        return $errUtils.throwErrByPath('net_stubbing.request_handling.event_needs_handler')
      }

      subscribe(eventName, handler)

      return userReq
    },
    continue (responseHandler?) {
      if (resolved) {
        return $errUtils.throwErrByPath('net_stubbing.request_handling.completion_called_after_resolved', { args: { cmd: 'continue' } })
      }

      if (handlerCompleted) {
        return $errUtils.throwErrByPath('net_stubbing.request_handling.multiple_completion_calls')
      }

      handlerCompleted = true

      if (typeof responseHandler === 'undefined') {
        return finish(true)
      }

      if (!_.isFunction(responseHandler)) {
        return $errUtils.throwErrByPath('net_stubbing.request_handling.req_continue_fn_only')
      }

      // allow `req` to be sent outgoing, then pass the response body to `responseHandler`
      subscribe('response:callback', responseHandler)

      userReq.responseTimeout = userReq.responseTimeout || Cypress.config('responseTimeout')

      return finish(true)
    },
    reply (responseHandler?, maybeBody?, maybeHeaders?) {
      if (resolved) {
        return $errUtils.throwErrByPath('net_stubbing.request_handling.completion_called_after_resolved', { args: { cmd: 'reply' } })
      }

      if (handlerCompleted) {
        return $errUtils.throwErrByPath('net_stubbing.request_handling.multiple_completion_calls')
      }

      if (_.isFunction(responseHandler)) {
        // backwards-compatibility: before req.continue, req.reply was used to intercept a response
        // or to end request handler propagation
        return userReq.continue(responseHandler)
      }

      handlerCompleted = true

      const staticResponse = parseStaticResponseShorthand(responseHandler, maybeBody, maybeHeaders)

      if (staticResponse) {
        responseHandler = staticResponse
      }

      if (!_.isUndefined(responseHandler)) {
        // `responseHandler` is a StaticResponse
        validateStaticResponse('req.reply', responseHandler)

        sendStaticResponse(requestId, responseHandler)

        return updateRequest(req)
      }

      return finish(true)
    },
    redirect (location, statusCode = 302) {
      userReq.reply({
        headers: { location },
        statusCode,
      })
    },
    destroy () {
      userReq.reply({
        forceNetworkError: true,
      }) // TODO: this misnomer is a holdover from XHR, should be numRequests
    },
  }

  let continueSent = false

  function updateRequest (req) {
    if (request) {
      request.request = _.cloneDeep(req)

      request.state = 'Intercepted'
      request.log && request.log.fireChangeEvent()
    }
  }

  if (!route) {
    return null
  }

  const finish = (stopPropagation: boolean) => {
    if (continueSent) {
      throw new Error('finish called twice in handler')
    }

    continueSent = true

    // copy changeable attributes of userReq to req
    _.merge(req, _.pick(userReq, SERIALIZABLE_REQ_PROPS))

    updateRequest(req)

    if (bodyParsed) {
      stringifyJsonBody(req)
    }

    resolve({
      changedData: req,
      stopPropagation,
    })
  }

  let resolve: (result: Result) => void

  const promise: Promise<Result> = new Promise((_resolve) => {
    resolve = _resolve
  })

  if (!request.log) {
    request.log = getRequestLog(route, request as Omit<Interception, 'log'>)
  }

  // TODO: this misnomer is a holdover from XHR, should be numRequests
  route.log.set('numResponses', (route.log.get('numResponses') || 0) + 1)

  if (!route.requests[requestId]) {
    debug('adding request to route', { requestId, routeId })
    route.requests[requestId] = request as Interception
  }

  if (!_.isFunction(userHandler)) {
    // notification-only
    return null
  }

  route.hitCount++

  const timeout = Cypress.config('defaultCommandTimeout')
  const curTest = Cypress.state('test')

  // if a Promise is returned, wait for it to resolve. if req.reply()
  // has not been called, continue to the next interceptor
  return Bluebird.try(() => {
    return userHandler(userReq)
  })
  .timeout(timeout)
  .catch(Bluebird.TimeoutError, (err) => {
    if (Cypress.state('test') !== curTest) {
      // active test has changed, ignore the timeout
      return
    }

    $errUtils.throwErrByPath('net_stubbing.request_handling.cb_timeout', { args: { timeout, req, route: route.options } })
  })
  .finally(() => {
    resolved = true
  })
  .then(() => {
    if (userReq.alias) {
      Cypress.state('aliasedRequests').push({
        alias: userReq.alias,
        request: request as Interception,
      })

      delete userReq.alias
    }

    if (!handlerCompleted) {
      // handler function completed without resolving request, pass on
      finish(false)
    }
  })
  .return(promise) as any as Bluebird<Result>
}
