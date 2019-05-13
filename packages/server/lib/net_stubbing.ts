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
  return _.concat(
    _.filter(['auth.username', 'auth.password', 'hostname', 'method', 'path', 'pathname', 'url'], _.partial(_.has, options)),
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
    return _doesRouteMatch(route.routeMatcher, req)
  })
}

export function _getMatchableForRequest(req) {
  let matchable : any = _.pick(req, ['headers', 'method', 'webSocket'])

  const authorization = req.headers['authorization']
  if (authorization) {
    const [mechanism, credentials] = authorization.split(' ', 2)
    if (mechanism && credentials && mechanism.toLowerCase() === 'basic') {
      const [username, password] = Buffer.from(credentials, 'base64').toString().split(':', 2)
      matchable.auth = { username, password }
    }
  }

  const proxiedUrl = url.parse(req.proxiedUrl, true)

  _.assign(matchable, _.pick(proxiedUrl, ['hostname', 'path', 'pathname', 'port', 'query']))

  matchable.url = req.proxiedUrl

  matchable.https = proxiedUrl.protocol && (proxiedUrl.protocol.indexOf('https') === 0)

  if (!matchable.port) {
    matchable.port = matchable.https ? 443 : 80
  }

  return matchable
}

/**
 * Returns `true` if `req` matches all supplied properties on `routeMatcher`, `false` otherwise.
 */
export function _doesRouteMatch(routeMatcher: RouteMatcherOptions, req: ProxyIncomingMessage) {
  const matchable = _getMatchableForRequest(req)

  let match = true

  // get a list of all the fields which exist where a rule needs to be succeed
  const stringMatcherFields = _getAllStringMatcherFields(routeMatcher)
  const booleanFields = _.filter(_.keys(routeMatcher), _.partial(_.includes, ['https', 'webSocket']))
  const numberFields = _.filter(_.keys(routeMatcher), _.partial(_.includes, ['port']))

  debug('%o', { stringMatcherFields, booleanFields, numberFields })

  stringMatcherFields.forEach((field) => {
    const matcher = _.get(routeMatcher, field)
    const value = _.get(matchable, field)
    if (matcher.test) {
      // value is a regex
      match = match && matcher.test(value)
      return
    }
    match = match && minimatch(value, matcher)
  })

  booleanFields.forEach((field) => {
    const matcher = _.get(routeMatcher, field)
    const value = _.get(matchable, field)
    match = match && (matcher === value)
  })

  numberFields.forEach((field) => {
    const matcher = _.get(routeMatcher, field)
    const value = _.get(matchable, field)
    if (matcher.length) {
      // list of numbers, any one can match
      match = match && matcher.includes(value)
      return
    }
    match = match && (matcher === value)
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
