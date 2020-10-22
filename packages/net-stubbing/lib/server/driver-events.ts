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
  setResponseFromFixture,
} from './util'
import { onRequestContinue } from './intercept-request'
import { onResponseContinue } from './intercept-response'
import CyServer from '@packages/server'

const debug = Debug('cypress:net-stubbing:server:driver-events')

async function _onRouteAdded (state: NetStubbingState, getFixture: GetFixtureFn, options: NetEventFrames.AddRoute) {
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

  const noAnnotationRequiredFields = ['https', 'port', 'webSocket']

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
      return _onRouteAdded(state, getFixture, <NetEventFrames.AddRoute>frame)
    case 'http:request:continue':
      return onRequestContinue(state, <NetEventFrames.HttpRequestContinue>frame, socket)
    case 'http:response:continue':
      return onResponseContinue(state, <NetEventFrames.HttpResponseContinue>frame)
    default:
      throw new Error(`Unrecognized net event: ${eventName}`)
  }
}
