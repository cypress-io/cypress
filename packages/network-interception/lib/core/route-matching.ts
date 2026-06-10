import _ from 'lodash'
import minimatch from 'minimatch'
import url from 'url'
import type { RouteMatcherOptions } from '../types'
import type { BackendRoute } from '../types/backend-route'
import { getAllStringMatcherFields } from './matcher-fields'

export type RouteMatchableRequest = {
  headers: Record<string, string | string[] | undefined>
  method: string
  proxiedUrl: string
  resourceType?: string
}

type Matchable = ReturnType<typeof getMatchableForRequest>

/**
 * A `StringMatcher` field compiled into a directly-executable form. Route
 * matchers are evaluated against every request flowing through the proxy, so
 * deriving the field list and compiling glob patterns must not be repeated
 * per request.
 */
type CompiledStringField = {
  field: string
  // a regex-like matcher (anything with a `.test` method), used as-is
  regex?: { test: (value: string) => boolean }
  matcher?: string
  mm?: minimatch.IMinimatch
  // precompiled `/${matcher}` fallback for url/path values that begin with a
  // slash when the matcher does not (e.g. `cy.intercept('services/api/*')`)
  slashMatcher?: string
  slashMm?: minimatch.IMinimatch
}

type CompiledRouteMatcher = {
  stringFields: CompiledStringField[]
  hasHttps: boolean
  https?: RouteMatcherOptions['https']
  hasPort: boolean
  port?: RouteMatcherOptions['port']
}

function compileStringField (routeMatcher: RouteMatcherOptions, field: string): CompiledStringField {
  let matcher = _.get(routeMatcher, field)

  if (matcher.test) {
    return { field, regex: matcher }
  }

  if (field === 'method') {
    matcher = matcher.toLowerCase()
  }

  const compiled: CompiledStringField = {
    field,
    matcher,
    mm: new minimatch.Minimatch(matcher, { matchBase: true }),
  }

  if (field === 'url' && matcher[0] !== '/') {
    compiled.slashMatcher = `/${matcher}`
    compiled.slashMm = new minimatch.Minimatch(compiled.slashMatcher, { matchBase: true })
  }

  return compiled
}

function compileRouteMatcher (routeMatcher: RouteMatcherOptions): CompiledRouteMatcher {
  return {
    stringFields: getAllStringMatcherFields(routeMatcher).map((field) => {
      return compileStringField(routeMatcher, field)
    }),
    hasHttps: _.has(routeMatcher, 'https'),
    https: routeMatcher.https,
    hasPort: _.has(routeMatcher, 'port'),
    port: routeMatcher.port,
  }
}

// Route matchers are never mutated once registered, so compiled forms are
// cached per matcher object for the lifetime of the route.
const compiledMatchers = new WeakMap<RouteMatcherOptions, CompiledRouteMatcher>()
// `matchesRoutePreflight` evaluates a reduced form of each matcher (without
// method/headers/auth), cached separately under the same key.
const compiledPreflightMatchers = new WeakMap<RouteMatcherOptions, CompiledRouteMatcher>()

function getCompiledMatcher (routeMatcher: RouteMatcherOptions) {
  let compiled = compiledMatchers.get(routeMatcher)

  if (!compiled) {
    compiled = compileRouteMatcher(routeMatcher)
    compiledMatchers.set(routeMatcher, compiled)
  }

  return compiled
}

function getCompiledPreflightMatcher (routeMatcher: RouteMatcherOptions) {
  let compiled = compiledPreflightMatchers.get(routeMatcher)

  if (!compiled) {
    compiled = compileRouteMatcher(_.omit(routeMatcher, 'method', 'headers', 'auth'))
    compiledPreflightMatchers.set(routeMatcher, compiled)
  }

  return compiled
}

function globMatch (entry: CompiledStringField, value: string) {
  return (
    value === entry.matcher ||
    entry.mm!.match(value) ||
    (entry.field === 'url' && value[0] === '/' && entry.slashMatcher !== undefined && (
      value === entry.slashMatcher || entry.slashMm!.match(value)
    ))
  )
}

function doesCompiledRouteMatch (compiled: CompiledRouteMatcher, matchable: Matchable) {
  const { stringFields } = compiled

  for (let i = 0; i < stringFields.length; i++) {
    const entry = stringFields[i]
    let value = _.get(matchable, entry.field, '')

    const shouldTryMatchingPath = entry.field === 'url'

    if (typeof value !== 'string') {
      value = String(value)
    }

    if (entry.regex) {
      if (!entry.regex.test(value) && (!shouldTryMatchingPath || !entry.regex.test(matchable.path))) {
        return false
      }

      continue
    }

    if (entry.field === 'method') {
      value = value.toLowerCase()
    }

    if (!globMatch(entry, value) && (!shouldTryMatchingPath || !globMatch(entry, matchable.path))) {
      return false
    }
  }

  if (compiled.hasHttps && compiled.https !== matchable.https) {
    return false
  }

  if (compiled.hasPort) {
    const matcher = compiled.port as any
    const value = matchable.port

    if (matcher.length) {
      if (!matcher.includes(value)) {
        return false
      }
    } else if (matcher !== value) {
      return false
    }
  }

  return true
}

/**
 * Returns `true` if `req` matches all supplied properties on `routeMatcher`, `false` otherwise.
 */
export function doesRouteMatch (routeMatcher: RouteMatcherOptions, req: RouteMatchableRequest) {
  return doesCompiledRouteMatch(getCompiledMatcher(routeMatcher), getMatchableForRequest(req))
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

  if (!matchable.port) {
    matchable.port = matchable.https ? 443 : 80
  }

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
  if (!routes.length) {
    return []
  }

  // parse the request into its matchable form once, not once per route
  const matchable = getMatchableForRequest(req)

  const middleware: BackendRoute[] = []
  const handlers: BackendRoute[] = []

  for (const route of routes) {
    (route.routeMatcher.middleware === true ? middleware : handlers).push(route)
  }

  const orderedRoutes = middleware.concat(handlers.reverse())

  return orderedRoutes.filter((route) => !route.disabled && doesCompiledRouteMatch(getCompiledMatcher(route.routeMatcher), matchable))
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
  if (!routes.length || !isPreflightRequest(req)) {
    return false
  }

  const matchable = getMatchableForRequest(req)

  let hasCorsOverride = false

  const matchingRoutes = _.filter(routes, ({ routeMatcher }) => {
    if (!doesCompiledRouteMatch(getCompiledPreflightMatcher(routeMatcher), matchable)) {
      return false
    }

    if (routeMatcher.method && /options/i.test(String(routeMatcher.method))) {
      hasCorsOverride = true
    }

    return true
  })

  return !hasCorsOverride && matchingRoutes.length > 0
}
