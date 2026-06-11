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

/*
 * Route matching runs for EVERY request that flows through the proxy — not
 * just requests that end up intercepted — so its per-request cost is paid by
 * static assets and third-party traffic too. To keep that cost low, the work
 * that depends only on the route matcher (deriving the field list, compiling
 * glob patterns, normalizing the method) is done once per matcher and cached,
 * and the work that depends only on the request (URL parsing via
 * `getMatchableForRequest`) is done once per request rather than once per
 * route. The matching semantics themselves are unchanged; each compiled step
 * mirrors a branch of the original per-request implementation.
 */

/**
 * A `StringMatcher` field compiled into a directly-executable form.
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

  // anything with a `.test` method is treated as a regex and used as-is —
  // duck-typing rather than `instanceof RegExp` so that regexes deserialized
  // across process boundaries (and user-supplied regex-likes) keep working
  if (matcher.test) {
    return { field, regex: matcher }
  }

  // methods match case-insensitively; the request value is lowercased at
  // match time, the matcher only needs lowercasing once
  if (field === 'method') {
    matcher = matcher.toLowerCase()
  }

  const compiled: CompiledStringField = {
    field,
    matcher,
    mm: new minimatch.Minimatch(matcher, { matchBase: true }),
  }

  // a url matcher without a leading slash (e.g. `cy.intercept('services/api/*')`)
  // must still match a request path like `/services/api/foo`, so the
  // slash-prefixed variant is compiled ahead of time too
  // @see https://github.com/cypress-io/cypress/issues/14256
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

// Compiled forms are cached lazily, keyed by matcher object identity. This is
// safe because route matchers are deserialized once when the driver registers
// the route and never mutated afterwards (the driver normalizes header casing
// before serialization). Using WeakMaps means no registration or teardown
// hooks are needed: entries are garbage-collected along with their routes
// when the state is reset between tests/specs.
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
  // exact equality is checked first so that common literal matchers
  // short-circuit without touching minimatch; the slash-prefixed fallback only
  // applies to url/path values, matching the original recursive `stringMatch`
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

    // a `url` matcher is allowed to match either the full proxied URL or just
    // its path, so users can write `cy.intercept('/api/*')` and still match
    // `http://host/api/foo`
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
  // suites with no `cy.intercept` calls hit this for every proxied request —
  // skip URL parsing entirely in that case
  if (!routes.length) {
    return []
  }

  // parse the request into its matchable form once, not once per route
  const matchable = getMatchableForRequest(req)

  // middleware routes are applied in registration order, then regular
  // handlers in reverse registration order — the most recently registered
  // handler wins, matching documented `cy.intercept` override behavior
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
