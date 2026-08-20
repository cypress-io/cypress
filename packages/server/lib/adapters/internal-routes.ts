import { id as randomId } from '../util/random'

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

const CLOUD_BUNDLE_ROUTES = [CYPRESS_STUDIO_ROUTE, CYPRESS_CY_PROMPT_ROUTE]

// The bundles ship independently of the binary and hang sibling namespaces off
// these bases (`/__cypress-studio-ai`, `/__cypress-studio-ai-anon`), so match
// the whole family: an unmatched one escapes to the AUT's origin, which is
// where the runner document's root-relative fetches land.
function matchesRouteFamily (pathname: string, route: string): boolean {
  if (!pathname.startsWith(route)) {
    return false
  }

  const boundary = pathname[route.length]

  return boundary === undefined || boundary === '/' || boundary === '-'
}

export function isCloudBundleRoute (pathname: string): boolean {
  return CLOUD_BUNDLE_ROUTES.some((route) => matchesRouteFamily(pathname, route))
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

  if (isBrowserNetworkMode && isCloudBundleRoute(pathname)) {
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
