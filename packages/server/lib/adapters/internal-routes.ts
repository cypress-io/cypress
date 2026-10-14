import { id as randomId } from '../util/random'
import type { HttpRequest } from '@packages/network-interception'

// Fields are optional at the type level because RuntimeConfigOptions extends
// Partial<...>. At runtime, `port` is required before loopback (toLoopbackUrl
// throws without it); `clientRoute` / `namespace` / `socketIoRoute` should be
// present whenever Express-owned internals are expected to match.
export type InternalRouteConfig = {
  clientRoute?: string
  namespace?: string
  port?: number | null
  proxyUrl?: string
  socketIoRoute?: string
  // CT Vite/webpack assets live under this prefix (default /__cypress/src).
  // They must not be treated as Express-owned internal routes.
  devServerPublicPathRoute?: string
}

// Marks trusted Express loopbacks from serve-internal-routes so
// _forceProxyMiddleware does not 302 path-only requests to clientRoute.
export const CYPRESS_INTERNAL_LOOPBACK_HEADER = 'x-cypress-internal-loopback'

// Shared-secret companion to the loopback URL header. AUT content can set
// arbitrary request headers on same-origin fetch, so presence of the URL
// header alone must not control proxiedUrl or forceProxy bypass.
export const CYPRESS_INTERNAL_LOOPBACK_TOKEN_HEADER = 'x-cypress-internal-loopback-token'

// Per-process secret known only to serve-internal-routes (same idea as the
// file-server authorization token).
export const cypressInternalLoopbackToken = randomId(64)

export function isTrustedInternalLoopback (
  headers: Record<string, string | string[] | undefined> | undefined,
): boolean {
  if (!headers) {
    return false
  }

  const token = headers[CYPRESS_INTERNAL_LOOPBACK_TOKEN_HEADER]

  return typeof token === 'string' && token === cypressInternalLoopbackToken
}

export function getTrustedLoopbackUrl (
  headers: Record<string, string | string[] | undefined> | undefined,
): string | undefined {
  if (!isTrustedInternalLoopback(headers) || !headers) {
    return undefined
  }

  const loopbackUrl = headers[CYPRESS_INTERNAL_LOOPBACK_HEADER]

  return typeof loopbackUrl === 'string' ? loopbackUrl : undefined
}

const LOCALHOST_NAMES = new Set([
  'localhost',
  '127.0.0.1',
  '::1',
  '[::1]',
])

function normalizeRoute (route: string): string {
  return route.endsWith('/') ? route.slice(0, -1) : route
}

export function matchesPathPrefix (pathname: string, route: string): boolean {
  const normalizedRoute = normalizeRoute(route)

  return pathname === normalizedRoute || pathname.startsWith(`${normalizedRoute}/`)
}

// Cloud-delivered bundle namespaces (studio, cy-prompt) served by Express
// routes outside /__cypress — see packages/server/lib/routes.ts. In
// cypress-in-cypress the parent's Express handlers for these paths re-enter
// the proxy to forward to the child project, so the loopback re-entry guard
// must let them continue instead of 404ing.
//
// Only internal on the browser (CDP) network path. Under MITM these reach Express
// through the legacy pipeline; looping them back skips later intercept
// stages and breaks studio.
export const CYPRESS_STUDIO_ROUTE = '/__cypress-studio'

export const CYPRESS_CY_PROMPT_ROUTE = '/__cypress-cy-prompt'

const CLOUD_BUNDLE_NAMESPACES = [CYPRESS_STUDIO_ROUTE, CYPRESS_CY_PROMPT_ROUTE]

export function isCloudBundleNamespace (pathname: string): boolean {
  return CLOUD_BUNDLE_NAMESPACES.some((namespace) => pathname.startsWith(namespace))
}

// Every path prefix Cypress reserves on an origin under test. Single source of
// truth for the two consumers that must agree on it — the service worker
// injector's decline list and the interception-escape warning's runner-document
// label — so neither can drift from the other or from the routes above.
//
// The client route and namespace carry their trailing slash; the cloud bundle
// namespaces stay bare so sibling namespaces (e.g. /__cypress-studio-ai) match.
export function getCypressReservedPathPrefixes (config: Pick<InternalRouteConfig, 'clientRoute' | 'namespace'>): string[] {
  return [
    config.clientRoute ?? '/__/',
    `/${config.namespace ?? '__cypress'}/`,
    ...CLOUD_BUNDLE_NAMESPACES,
  ]
}

// `isBrowserNetworkMode` is a property of the runtime that installed the caller,
// not a value read at request time: each network runtime serves exactly one path.
export function isInternalCypressRoute (pathname: string, config: InternalRouteConfig, isBrowserNetworkMode: boolean): boolean {
  // Component-testing app/spec assets are served by the bundler under
  // /__cypress/src (or a custom public path). Matching the whole namespace
  // would incorrectly loop those requests back to Express.
  if (config.devServerPublicPathRoute && matchesPathPrefix(pathname, config.devServerPublicPathRoute)) {
    return false
  }

  if (isBrowserNetworkMode && isCloudBundleNamespace(pathname)) {
    return true
  }

  const internalRoutes = [
    config.namespace ? `/${config.namespace}` : undefined,
    config.clientRoute,
    config.socketIoRoute,
    config.socketIoRoute ? `${config.socketIoRoute}-graphql` : undefined,
  ].filter((route): route is string => Boolean(route))

  return internalRoutes.some((route) => matchesPathPrefix(pathname, route))
}

export function resolveProxyUrlBase (config: Pick<InternalRouteConfig, 'port' | 'proxyUrl'>): string {
  if (config.proxyUrl) {
    return config.proxyUrl
  }

  if (!config.port) {
    throw new Error('Cannot resolve Cypress proxy URL before the server port is assigned')
  }

  return `http://localhost:${config.port}`
}

export function isCypressServerOrigin (requestUrl: string, config: InternalRouteConfig): boolean {
  if (!config.port) {
    return false
  }

  const serverUrl = new URL(resolveProxyUrlBase(config))
  const url = new URL(requestUrl, serverUrl)

  if (url.port !== String(config.port)) {
    return false
  }

  return url.hostname === serverUrl.hostname || LOCALHOST_NAMES.has(url.hostname)
}

export function parseRequestUrl (requestUrl: string, config: Pick<InternalRouteConfig, 'port' | 'proxyUrl'>): URL {
  if (/^https?:\/\//i.test(requestUrl)) {
    return new URL(requestUrl)
  }

  return new URL(requestUrl, resolveProxyUrlBase(config))
}

// The large bodies the origin redirect exists for are responses to reads, and
// writes keep the loopback, which forwards their request bodies.
export function isReadMethod (method: string | undefined): boolean {
  return ['GET', 'HEAD'].includes((method ?? 'GET').toUpperCase())
}

// In cypress-in-cypress the inner Cypress shares the browser page with the
// parent. Own-origin requests in two classes are left to the parent's
// pipeline instead of being answered by Cypress, matching the e2e-mode
// topology where the inner has no interception at all:
//   - clientRoute paths: the runner document IS the parent's AUT document,
//     which the parent must inject, plus its static assets. Answering it in
//     the inner's pipeline would preempt the parent's interception, so
//     window:before:load would die silently.
//   - concrete subresource types (xhr/fetch/script/...): e.g. the app's
//     /__cypress/graphql calls, which the parent's cy.intercept must see.
//     Injection never touches non-documents.
// Everything else stays with Cypress. Documents normalize to 'other', so a
// non-clientRoute document such as the CT fixture iframe
// (/__cypress/iframes) is kept out of the parent's partial injection, which
// would reroute the inner AUT's deliberate test errors to the parent as
// cross-origin uncaught exceptions. Foreign-origin internal routes (the CT
// dev server origin) never reach the inner's Express over the wire, so they
// stay with Cypress too.
export function isReleasedToParent (request: HttpRequest, url: URL, config: InternalRouteConfig): boolean {
  return Boolean(
    process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF
    && isCypressServerOrigin(request.url, config)
    && (
      (config.clientRoute && matchesPathPrefix(url.pathname, config.clientRoute))
      || (request.resourceType && request.resourceType !== 'other')
    ),
  )
}

// Whether Cypress answers this request itself: an internal route that is
// neither trusted loopback re-entry (the middleware handles that separately)
// nor released to the cypress-in-cypress parent. The CDP transport uses it to
// decide which pauses it can send to the Cypress origin. It is built from the
// same checks the serve-internal-routes middleware runs, in the same order.
export function isAnsweredByCypress (request: HttpRequest, config: InternalRouteConfig, isBrowserNetworkMode: boolean): boolean {
  const url = parseRequestUrl(request.url, config)

  return isInternalCypressRoute(url.pathname, config, isBrowserNetworkMode)
    && !isTrustedInternalLoopback(request.headers)
    && !isReleasedToParent(request, url, config)
}
