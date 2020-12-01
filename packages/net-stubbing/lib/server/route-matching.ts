import _ from 'lodash'
import minimatch from 'minimatch'
import url from 'url'

import { CypressIncomingRequest } from '@packages/proxy'
import { BackendRoute } from './types'
import { RouteMatcherOptions } from '../types'
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

    if (typeof value !== 'string') {
      value = String(value)
    }

    if (matcher.test) {
      if (!matcher.test(value)) {
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

    if (field === 'url') {
      if (value.includes(matcher)) {
        continue
      }
    }

    if (!minimatch(value, matcher, { matchBase: true })) {
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
  let matchable: any = _.pick(req, ['headers', 'method'])

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

export function getRouteForRequest (routes: BackendRoute[], req: CypressIncomingRequest, prevRoute?: BackendRoute) {
  const possibleRoutes = prevRoute ? routes.slice(_.findIndex(routes, prevRoute) + 1) : routes

  return _.find(possibleRoutes, (route) => {
    return _doesRouteMatch(route.routeMatcher, req)
  })
}
