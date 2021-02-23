import _ from 'lodash'
import Debug from 'debug'
import {
  NetStubbingState,
  GetFixtureFn,
  BackendRoute,
} from './types'
import {
  AnnotatedRouteMatcherOptions,
  NetEventFrames,
  RouteMatcherOptions,
} from '../types'
import {
  getAllStringMatcherFields,
  sendStaticResponse as _sendStaticResponse,
  setResponseFromFixture,
} from './util'
import { onRequestContinue } from './intercept-request'
import { onResponseContinue } from './intercept-response'
import CyServer from '@packages/server'

const debug = Debug('cypress:net-stubbing:server:driver-events')

async function onRouteAdded (state: NetStubbingState, getFixture: GetFixtureFn, options: NetEventFrames.AddRoute) {
  const routeMatcher = _restoreMatcherOptionsTypes(options.routeMatcher)
  const { staticResponse } = options

  if (staticResponse) {
    await setResponseFromFixture(getFixture, staticResponse)
  }

  const route: BackendRoute = {
    routeMatcher,
    getFixture,
    ..._.omit(options, 'routeMatcher'), // skip the user's un-annotated routeMatcher
  }

  state.routes.push(route)
}

function getRequest (state: NetStubbingState, routeHandlerId: string, _requestId: string) {
  return Object.values(state.requests).find(({ requestId, route }) => {
    return _requestId === requestId && routeHandlerId === route.handlerId
  })
}

function subscribe (state: NetStubbingState, options: NetEventFrames.Subscribe) {
  const request = getRequest(state, options.routeHandlerId, options.requestId)

  if (!request) {
    return
  }

  request.subscriptions.push(options.subscription)
}

async function sendStaticResponse (state: NetStubbingState, getFixture: GetFixtureFn, options: NetEventFrames.SendStaticResponse) {
  const request = getRequest(state, options.routeHandlerId, options.requestId)

  if (!request) {
    return
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

  const noAnnotationRequiredFields: (keyof AnnotatedRouteMatcherOptions)[] = ['https', 'port', 'matchUrlAgainstPath', 'middleware']

  _.extend(ret, _.pick(options, noAnnotationRequiredFields))

  return ret
}

type OnNetEventOpts = {
  eventName: string
  state: NetStubbingState
  socket: CyServer.Socket
  getFixture: GetFixtureFn
  args: any[]
  frame: NetEventFrames.AddRoute | NetEventFrames.HttpRequestContinue | NetEventFrames.HttpResponseContinue
}

export async function onNetEvent (opts: OnNetEventOpts): Promise<any> {
  const { state, socket, getFixture, args, eventName, frame } = opts

  debug('received driver event %o', { eventName, args })

  switch (eventName) {
    case 'route:added':
      return onRouteAdded(state, getFixture, <NetEventFrames.AddRoute>frame)
    case 'subscribe':
      return subscribe(state, <NetEventFrames.Subscribe>frame)
    case 'send:static:response':
      return sendStaticResponse(state, getFixture, <NetEventFrames.SendStaticResponse>frame)
    case 'http:request:continue':
      return onRequestContinue(state, <NetEventFrames.HttpRequestContinue>frame, socket)
    case 'http:response:continue':
      return onResponseContinue(state, <NetEventFrames.HttpResponseContinue>frame)
    default:
      throw new Error(`Unrecognized net event: ${eventName}`)
  }
}
