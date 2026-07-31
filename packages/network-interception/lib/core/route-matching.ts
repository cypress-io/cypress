import _ from 'lodash'
import minimatch from 'minimatch'
import url from 'url'
import { debug } from '../debug'
import type { RouteMatcherOptions } from '../types'
import type { BackendRoute } from '../types/backend-route'
import { getAllStringMatcherFields } from './matcher-fields'

export type RouteMatchableRequest = {
  headers: Record<string, string | string[] | undefined>
  method: string
  proxiedUrl: string
  resourceType?: string
}

/**
 * Returns `true` if `req` matches all supplied properties on `routeMatcher`, `false` otherwise.
 */
export function doesRouteMatch (routeMatcher: RouteMatcherOptions, req: RouteMatchableRequest) {
  const matchable = getMatchableForRequest(req)

  const stringMatcherFields = getAllStringMatcherFields(routeMatcher)
  const booleanFields = _.filter(_.keys(routeMatcher), _.partial(_.includes, ['https']))
  const numberFields = _.filter(_.keys(routeMatcher), _.partial(_.includes, ['port']))

  for (let i = 0; i < stringMatcherFields.length; i++) {
    const field = stringMatcherFields[i]
    let matcher = _.get(routeMatcher, field)
    let value = _.get(matchable, field, '')

    const shouldTryMatchingPath = field === 'url'

    const stringMatch = (value: string, matcher: string) => {
      return (
        value === matcher ||
        minimatch(value, matcher, { matchBase: true }) ||
        (field === 'url' && (
          (value[0] === '/' && matcher[0] !== '/' && stringMatch(value, `/${matcher}`))
        ))
      )
    }

    if (typeof value !== 'string') {
      value = String(value)
    }

    if (matcher.test) {
      if (!matcher.test(value) && (!shouldTryMatchingPath || !matcher.test(matchable.path))) {
        return false
      }

      continue
    }

    if (field === 'method') {
      value = value.toLowerCase()
      matcher = matcher.toLowerCase()
    }

    if (!stringMatch(value, matcher) && (!shouldTryMatchingPath || !stringMatch(matchable.path, matcher))) {
      return false
    }
  }

  for (let i = 0; i < booleanFields.length; i++) {
    const field = booleanFields[i]
    const matcher = _.get(routeMatcher, field)
    const value = _.get(matchable, field)

    if (matcher !== value) {
      return false
    }
  }

  for (let i = 0; i < numberFields.length; i++) {
    const field = numberFields[i]
    const matcher = _.get(routeMatcher, field)
    const value = _.get(matchable, field)

    if (matcher.length) {
      if (!matcher.includes(value)) {
        return false
      }

      continue
    }

    if (matcher !== value) {
      return false
    }
  }

  return true
}

export function getMatchableForRequest (req: RouteMatchableRequest) {
  let matchable: any = _.pick(req, ['headers', 'method', 'resourceType'])

  const authorization = req.headers['authorization']
  const authHeader = Array.isArray(authorization) ? authorization[0] : authorization

  if (authHeader) {
    const [mechanism, credentials] = authHeader.split(' ', 2)

    if (mechanism && credentials && mechanism.toLowerCase() === 'basic') {
      const [username, password] = Buffer.from(credentials, 'base64').toString().split(':', 2)

      matchable.auth = { username, password }
    }
  }

  const proxiedUrl = url.parse(req.proxiedUrl, true)

  _.assign(matchable, _.pick(proxiedUrl, ['hostname', 'path', 'pathname', 'port', 'query']))

  matchable.url = req.proxiedUrl

  matchable.https = proxiedUrl.protocol && (proxiedUrl.protocol.indexOf('https') === 0)

  // `url.parse` yields the port as a string; coerce it so it compares against
  // the numeric `port` route matcher. Fall back to the protocol default.
  matchable.port = matchable.port ? Number(matchable.port) : (matchable.https ? 443 : 80)

  return matchable
}

/** @deprecated Use {@link doesRouteMatch} — kept for net-stubbing strangler re-exports. */
export const _doesRouteMatch = doesRouteMatch

/** @deprecated Use {@link getMatchableForRequest} */
export const _getMatchableForRequest = getMatchableForRequest

/**
 * Find all `BackendRoute`s that match the supplied request.
 */
export function matchRoutes (routes: BackendRoute[], req: RouteMatchableRequest): BackendRoute[] {
  const [middleware, handlers] = _.partition(routes, (route) => route.routeMatcher.middleware === true)
  const orderedRoutes = middleware.concat(handlers.reverse())

  const matched = orderedRoutes.filter((route) => !route.disabled && doesRouteMatch(route.routeMatcher, req))

  debug.routes('%s %s matched %d of %d route(s) %o',
    req.method,
    req.proxiedUrl,
    matched.length,
    routes.length,
    matched.map((route) => route.id))

  return matched
}

/** @deprecated Use {@link matchRoutes} */
export function* getRoutesForRequest (routes: BackendRoute[], req: RouteMatchableRequest) {
  for (const route of matchRoutes(routes, req)) {
    yield route
  }
}

function isPreflightRequest (req: RouteMatchableRequest) {
  return req.method === 'OPTIONS' && req.headers['access-control-request-method']
}

/**
 * Whether the proxy should auto-respond to this CORS preflight OPTIONS request.
 * Returns true when the request is a preflight, at least one route matches (ignoring
 * method/headers/auth on the matcher), and no matching route explicitly handles OPTIONS.
 */
export function matchesRoutePreflight (routes: BackendRoute[], req: RouteMatchableRequest) {
  if (!isPreflightRequest(req)) {
    return false
  }

  let hasCorsOverride = false

  const matchingRoutes = _.filter(routes, ({ routeMatcher }) => {
    const preflightMatcher = _.omit(routeMatcher, 'method', 'headers', 'auth')

    if (!doesRouteMatch(preflightMatcher, req)) {
      return false
    }

    if (routeMatcher.method && /options/i.test(String(routeMatcher.method))) {
      hasCorsOverride = true
    }

    return true
  })

  const shouldAutoRespond = !hasCorsOverride && matchingRoutes.length > 0

  if (shouldAutoRespond) {
    debug.routes('preflight auto-respond %s %s (%d matching route(s))',
      req.method,
      req.proxiedUrl,
      matchingRoutes.length)
  }

  return shouldAutoRespond
}
