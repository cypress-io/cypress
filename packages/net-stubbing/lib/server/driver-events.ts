import _ from 'lodash'
import Debug from 'debug'
import {
  NetStubbingState,
  GetFixtureFn,
  BackendRoute,
} from './types'
import {
  PLAIN_FIELDS,
  AnnotatedRouteMatcherOptions,
  RouteMatcherOptions,
  NetEvent,
} from '../types'
import {
  getAllStringMatcherFields,
  sendStaticResponse as _sendStaticResponse,
  setResponseFromFixture,
} from './util'
import { InterceptedRequest } from './intercepted-request'
import CyServer from '@packages/server'

const debug = Debug('cypress:net-stubbing:server:driver-events')

async function onRouteAdded (state: NetStubbingState, getFixture: GetFixtureFn, options: NetEvent.ToServer.AddRoute) {
  const routeMatcher = _restoreMatcherOptionsTypes(options.routeMatcher)
  const { staticResponse } = options

  if (staticResponse) {
    await setResponseFromFixture(getFixture, staticResponse)
  }

  const route: BackendRoute = {
    id: options.routeId,
    hasInterceptor: options.hasInterceptor,
    staticResponse: options.staticResponse,
    routeMatcher,
    getFixture,
  }

  state.routes.push(route)
}

function getRequest (state: NetStubbingState, requestId: string) {
  return Object.values(state.requests).find(({ id }) => {
    return requestId === id
  })
}

function subscribe (state: NetStubbingState, options: NetEvent.ToServer.Subscribe) {
  const request = getRequest(state, options.requestId)

  if (!request) {
    return
  }

  request.addSubscription(options.subscription)
}

async function sendStaticResponse (state: NetStubbingState, getFixture: GetFixtureFn, options: NetEvent.ToServer.SendStaticResponse) {
  const request = getRequest(state, options.requestId)

  if (!request) {
    return
  }

  if (options.staticResponse.fixture && ['before:response', 'response:callback', 'response'].includes(request.lastEvent!)) {
    // if we're already in a response phase, it's possible that the fixture body will never be sent to the browser
    // so include the fixture body in `after:response`
    request.includeBodyInAfterResponse = true
  }

  await setResponseFromFixture(getFixture, options.staticResponse)

  _sendStaticResponse(request, options.staticResponse)
}

export function _restoreMatcherOptionsTypes (options: AnnotatedRouteMatcherOptions) {
  const stringMatcherFields = getAllStringMatcherFields(options)

  const ret: RouteMatcherOptions = {}

  stringMatcherFields.forEach((field) => {
    const obj = _.get(options, field)

    if (!obj) {
      return
    }

    let { value, type } = obj

    if (type === 'regex') {
      const lastSlashI = value.lastIndexOf('/')
      const flags = value.slice(lastSlashI + 1)
      const pattern = value.slice(1, lastSlashI)

      value = new RegExp(pattern, flags)
    }

    _.set(ret, field, value)
  })

  _.extend(ret, _.pick(options, PLAIN_FIELDS))

  return ret
}

type OnNetEventOpts = {
  eventName: string
  state: NetStubbingState
  socket: CyServer.Socket
  getFixture: GetFixtureFn
  args: any[]
  frame: NetEvent.ToServer.AddRoute | NetEvent.ToServer.EventHandlerResolved | NetEvent.ToServer.Subscribe | NetEvent.ToServer.SendStaticResponse
}

export async function onNetEvent (opts: OnNetEventOpts): Promise<any> {
  const { state, getFixture, args, eventName, frame } = opts

  debug('received driver event %o', { eventName, args })

  switch (eventName) {
    case 'route:added':
      return onRouteAdded(state, getFixture, <NetEvent.ToServer.AddRoute>frame)
    case 'subscribe':
      return subscribe(state, <NetEvent.ToServer.Subscribe>frame)
    case 'event:handler:resolved':
      return InterceptedRequest.resolveEventHandler(state, <NetEvent.ToServer.EventHandlerResolved>frame)
    case 'send:static:response':
      return sendStaticResponse(state, getFixture, <NetEvent.ToServer.SendStaticResponse>frame)
    default:
      throw new Error(`Unrecognized net event: ${eventName}`)
  }
}
