import _ from 'lodash'
import debugModule from 'debug'
import { NetStubbingState } from './types'
import {
  AnnotatedRouteMatcherOptions,
  NetEventFrames,
  RouteMatcherOptions,
} from '../types'
import { getAllStringMatcherFields } from './util'
import { onRequestContinue } from './intercept-request'
import { onResponseContinue } from './intercept-response'

const debug = debugModule('cypress:net-stubbing:server:driver-events')

export function onBeforeTestRun (state: NetStubbingState) {
  debug('resetting net_stubbing state')

  // clean up requests that are still pending
  for (const requestId in state.requests) {
    const request = state.requests[requestId]

    // TODO: try/catch?
    request.res.removeAllListeners('finish')
    request.res.removeAllListeners('error')
    request.res.on('error', _.noop)
    request.res.destroy()
  }

  state.reset()
}

function _onRouteAdded (state: NetStubbingState, options: NetEventFrames.AddRoute) {
  const routeMatcher = _restoreMatcherOptionsTypes(options.routeMatcher)

  debug('adding route %o', { routeMatcher, options })

  state.routes.push({
    routeMatcher,
    ..._.omit(options, 'routeMatcher'),
  })
}

function _restoreMatcherOptionsTypes (options: AnnotatedRouteMatcherOptions) {
  const stringMatcherFields = getAllStringMatcherFields(options)

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

export function onNetEvent (state: NetStubbingState, socket: any, eventName: string, ...args: any[]) {
  debug('received driver event %o', { eventName, args })

  switch (eventName) {
    case 'route:added':
      _onRouteAdded(state, <NetEventFrames.AddRoute>args[0])
      break
    case 'http:request:continue':
      onRequestContinue(state, <NetEventFrames.HttpRequestContinue>args[0], socket)
      break
    case 'http:response:continue':
      onResponseContinue(state, <NetEventFrames.HttpResponseContinue>args[0])
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
