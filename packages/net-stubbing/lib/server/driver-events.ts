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
  getStaticResponseFixture,
} from './util'
import { onRequestContinue } from './intercept-request'
import { onResponseContinue } from './intercept-response'
import CyServer from '@packages/server'

// TODO: move this into net-stubbing once cy.route is removed
import { parseContentType } from '@packages/server/lib/controllers/xhrs'

const debug = Debug('cypress:net-stubbing:server:driver-events')

const caseInsensitiveGet = function (obj, lowercaseProperty) {
  for (let key of Object.keys(obj)) {
    if (key.toLowerCase() === lowercaseProperty) {
      return obj[key]
    }
  }
}

async function _onRouteAdded (state: NetStubbingState, getFixture: GetFixtureFn, options: NetEventFrames.AddRoute) {
  const routeMatcher = _restoreMatcherOptionsTypes(options.routeMatcher)
  const { staticResponse } = options

  if (staticResponse && staticResponse.fixture) {
    // validate that the fixture exists too, this will reject if not
    staticResponse.body = await getStaticResponseFixture(getFixture, staticResponse)
    .then((fixture) => {
      const { headers } = staticResponse

      if (!headers || !caseInsensitiveGet(headers, 'content-type')) {
        _.set(staticResponse, 'headers.content-type', parseContentType(fixture))
      }

      // NOTE: for backwards compatibility with cy.route
      if (fixture === null) {
        return ''
      }

      if (!_.isBuffer(fixture) && !_.isString(fixture)) {
        // TODO: probably we can use another function in fixtures.js that doesn't require us to remassage the fixture
        return JSON.stringify(fixture)
      }

      return fixture
    })
  }

  const route: BackendRoute = {
    routeMatcher,
    ..._.omit(options, 'routeMatcher'),
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
