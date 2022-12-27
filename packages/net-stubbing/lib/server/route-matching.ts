import _ from 'lodash'
import minimatch from 'minimatch'
import url from 'url'

import type { CypressIncomingRequest } from '@packages/proxy'
import type { BackendRoute } from './types'
import type { RouteMatcherOptions } from '../types'
import { getAllStringMatcherFields } from './util'

/**
 * Returns `true` if `req` matches all supplied properties on `routeMatcher`, `false` otherwise.
 */
export function _doesRouteMatch (routeMatcher: RouteMatcherOptions, req: CypressIncomingRequest) {
  const matchable = _getMatchableForRequest(req)

  // get a list of all the fields which exist where a rule needs to be succeed
  const stringMatcherFields = getAllStringMatcherFields(routeMatcher)
  const booleanFields = _.filter(_.keys(routeMatcher), _.partial(_.includes, ['https']))
  const numberFields = _.filter(_.keys(routeMatcher), _.partial(_.includes, ['port']))

  for (let i = 0; i < stringMatcherFields.length; i++) {
    const field = stringMatcherFields[i]
    let matcher = _.get(routeMatcher, field)
    let value = _.get(matchable, field, '')

    // for convenience, attempt to match `url` against `path`?
    const shouldTryMatchingPath = field === 'url'

    const stringMatch = (value: string, matcher: string) => {
      return (
        value === matcher ||
        minimatch(value, matcher, { matchBase: true }) ||
        (field === 'url' && (
          // be nice and match paths that are missing leading slashes
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
      // case-insensitively match on method
      // @see https://github.com/cypress-io/cypress/issues/9313
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

export function _getMatchableForRequest (req: CypressIncomingRequest) {
  let matchable: any = _.pick(req, ['headers', 'method', 'resourceType'])

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
 * Find all `BackendRoute`s that match the supplied request.
 */
export function* getRoutesForRequest (routes: BackendRoute[], req: CypressIncomingRequest) {
  const [middleware, handlers] = _.partition(routes, (route) => route.routeMatcher.middleware === true)
  // First, match the oldest matching route handler with `middleware: true`.
  // Then, match the newest matching route handler.
  const orderedRoutes = middleware.concat(handlers.reverse())

  for (const route of orderedRoutes) {
    if (!route.disabled && _doesRouteMatch(route.routeMatcher, req)) {
      yield route
    }
  }
}

function isPreflightRequest (req: CypressIncomingRequest) {
  return req.method === 'OPTIONS' && req.headers['access-control-request-method']
}

/**
 * Is this a CORS preflight request that could be for an existing route?
 * If there is a matching route with method = 'OPTIONS', returns false.
 */
export function matchesRoutePreflight (routes: BackendRoute[], req: CypressIncomingRequest) {
  if (!isPreflightRequest(req)) {
    return false
  }

  let hasCorsOverride = false

  const matchingRoutes = _.filter(routes, ({ routeMatcher }) => {
    // omit headers from matching since preflight req will not send headers
    const preflightMatcher = _.omit(routeMatcher, 'method', 'headers', 'auth')

    if (!_doesRouteMatch(preflightMatcher, req)) {
      return false
    }

    if (routeMatcher.method && /options/i.test(String(routeMatcher.method))) {
      hasCorsOverride = true
    }

    return true
  })

  return !hasCorsOverride && matchingRoutes.length
}
