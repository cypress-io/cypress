import * as _ from 'lodash'
import debugModule from 'debug'
import { IncomingMessage } from 'http'
import minimatch from 'minimatch'
import url from 'url'
// TODO: figure out the right way to make these types accessible in server and driver
import {
  AddRouteFrame,
  AnnotatedRouteMatcherOptions,
  RouteMatcherOptions
} from '../../driver/src/cy/commands/net_stubbing'

interface BackendRoute {
  routeMatcher: RouteMatcherOptions
  handlerId?: string
  responseBody?: string
  responseHeaders?: { [key: string] : string }
}

interface ProxyIncomingMessage extends IncomingMessage {
  proxiedUrl: string
  webSocket: boolean // TODO: populate
}

const debug = debugModule('cypress:server:net_stubbing')

function _getAllStringMatcherFields(options) {
  return ['auth.username', 'auth.password', 'hostname', 'method', 'path', 'pathname', 'url'].concat(
    // add the nested DictStringMatcher values to the list of fields
    _.flatten(
      _.filter(
        ['headers', 'query'].map(field => {
          const value = options[field]

          if (value) {
            return _.keys(value).map(key => {
              return `${field}.${key}`
            })
          }

          return ''
        })
      )
    )
  )
}

function _restoreMatcherOptionsTypes(options: AnnotatedRouteMatcherOptions) {
  const stringMatcherFields = _getAllStringMatcherFields(options)

  const ret : RouteMatcherOptions = {}

  stringMatcherFields.forEach(field => {
    const obj = _.get(options, field)

    if (obj) {
      _.set(ret, field, obj.type === 'regex' ? new RegExp(obj.value) : obj.value)
    }
  })

  const noAnnotationRequiredFields = ['https', 'port', 'webSocket']
  _.extend(ret, _.pick(options, noAnnotationRequiredFields))

  return ret
}

let routes : BackendRoute[] = []

function _onRouteAdded(options: AddRouteFrame) {
  const routeMatcher = _restoreMatcherOptionsTypes(options.routeMatcher)

  debug('adding route %o', { routeMatcher, options })

  routes.push({
    routeMatcher,
    ..._.omit(options, 'routeMatcher')
  })
}

function _getRouteForRequest(req: ProxyIncomingMessage, prevRoute?: BackendRoute) {
  const possibleRoutes = prevRoute ? routes.slice(_.findIndex(routes, prevRoute) + 1) : routes
  return _.find(possibleRoutes, route => {
    return _isRouteMatched(route.routeMatcher, req)
  })
}

function _getMatchableForRequest(req) {
  let matchable : any = _.pick(req, ['headers', 'method', 'webSocket'])

  const authorization = req.headers['authorization']
  if (authorization) {
    const [mechanism, credentials] = authorization.split(' ', 2)
    if (mechanism && credentials && mechanism.toLowerCase() === 'basic') {
      const [username, password] = atob(credentials).split(':', 2)
      matchable.auth = { username, password }
    }
  }

  const proxiedUrl = url.parse(req.proxiedUrl)

  _.assign(matchable, _.pick(proxiedUrl, ['hostname', 'path', 'pathname', 'port', 'query']))

  matchable.url = req.proxiedUrl

  matchable.https = proxiedUrl.protocol && (proxiedUrl.protocol.indexOf('https') === 0)

  return matchable
}

/**
 * Returns `true` if `req` matches all supplied properties on `routeMatcher`, `false` otherwise.
 */
function _isRouteMatched(routeMatcher: RouteMatcherOptions, req: ProxyIncomingMessage) {
  const matchable = _getMatchableForRequest(req)

  let match = true

  // get a list of all the fields which exist where a rule needs to be succeed
  const stringMatcherFields = _getAllStringMatcherFields(matchable)
  const booleanFields = Object.keys(matchable).filter(_.partial(_.includes, ['https', 'webSocket']))
  const numberFields = Object.keys(matchable).filter(_.partial(_.includes, ['port']))

  stringMatcherFields.forEach((field) => {
    const value = routeMatcher[field]
    if (value.test) {
      // value is a regex
      match = match && value.test(matchable[field])
      return
    }
    match = match && minimatch(matchable[field], value)
  })

  booleanFields.forEach((field) => {
    match = match && (matchable[field] === routeMatcher[field])
  })

  numberFields.forEach((field) => {
    const value = routeMatcher[field]
    if (value.length) {
      // list of numbers, any one can match
      match = match && value.includes(matchable[field])
      return
    }
    match = match && (matchable[field] === value)
  })

  return match
}

export function onDriverEvent(eventName: string, ...args: any[]) {
  debug('received driver event %o', { eventName, args })

  switch(eventName) {
    case 'route:added':
      _onRouteAdded(<AddRouteFrame>args[0])
      break
    case 'http:request:continue':
      break
    case 'http:response:continue':
      break
    case 'ws:connect:continue':
      break
    case 'ws:frame:outgoing:continue':
      break
    case 'ws:frame:incoming:continue':
      break
  }
}
