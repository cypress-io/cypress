import _ from 'lodash'
import Debug from 'debug'
import type { BackendRoute, BackendStaticResponse, ForPendingHandlerResolution, ForStubbing, GetFixtureFn } from '@packages/network-interception'
import {
  PLAIN_FIELDS,
  AnnotatedRouteMatcherOptions,
  RouteMatcherOptions,
  NetEvent,
} from '@packages/network-interception'
import {
  getAllStringMatcherFields,
  setResponseFromFixture,
} from './util'
import type { CyInterceptIntercepter } from '../intercepters/cy-intercept-intercepter'

const debug = Debug('cypress:net-stubbing:server:driver-events')

async function onRouteAdded (state: ForStubbing, getFixture: GetFixtureFn, options: NetEvent.ToServer.AddRoute<BackendStaticResponse>) {
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
    matches: 0,
  }

  state.routes.push(route)
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

export type OnNetStubbingEventFrame = NetEvent.ToServer.AddRoute<BackendStaticResponse> | NetEvent.ToServer.Subscribe | NetEvent.ToServer.EventHandlerResolved | NetEvent.ToServer.SendStaticResponse

type OnNetStubbingEventOpts = {
  eventName: string
  state: ForStubbing
  getFixture: GetFixtureFn
  frame: OnNetStubbingEventFrame
  cyIntercept: CyInterceptIntercepter
  pendingHandlerResolution: ForPendingHandlerResolution
}

export async function onNetStubbingEvent (opts: OnNetStubbingEventOpts): Promise<any> {
  const { getFixture, eventName, frame, state, cyIntercept, pendingHandlerResolution } = opts

  debug('received driver event %o', { eventName, frame })

  switch (eventName) {
    case 'route:added':
      return onRouteAdded(state, getFixture, <NetEvent.ToServer.AddRoute<BackendStaticResponse>>frame)
    case 'subscribe':
      return cyIntercept.addSubscription(
        (<NetEvent.ToServer.Subscribe>frame).requestId,
        (<NetEvent.ToServer.Subscribe>frame).subscription,
      )
    case 'event:handler:resolved':
      return pendingHandlerResolution.resolveEventHandler(<NetEvent.ToServer.EventHandlerResolved>frame)
    case 'send:static:response': {
      const sendStaticResponseFrame = <NetEvent.ToServer.SendStaticResponse>frame

      return cyIntercept.fulfillStaticResponse(
        sendStaticResponseFrame.requestId,
        sendStaticResponseFrame.staticResponse,
        getFixture,
      )
    }
    default:
      throw new Error(`Unrecognized net event: ${eventName}`)
  }
}
