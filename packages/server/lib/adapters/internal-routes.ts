import crypto from 'crypto'

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

// Lazily generated so the value is never baked into the V8 snapshot.
let loopbackToken: string | undefined

function getLoopbackToken (): string {
  if (!loopbackToken) {
    loopbackToken = crypto.randomBytes(16).toString('hex')
  }

  return loopbackToken
}

// AUT content can send the loopback header itself (same-origin fetch allows
// custom headers), so the value carries a per-process secret alongside the
// browser's original absolute URL. Consumers that trust the URL must decode;
// header presence alone proves nothing.
export function encodeLoopbackHeader (url: string): string {
  return `${getLoopbackToken()} ${url}`
}

export function decodeLoopbackHeader (value: string | string[] | undefined): string | undefined {
  if (typeof value !== 'string') {
    return
  }

  const separator = value.indexOf(' ')

  if (separator === -1 || value.slice(0, separator) !== getLoopbackToken()) {
    return
  }

  return value.slice(separator + 1)
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

function matchesPathPrefix (pathname: string, route: string): boolean {
  const normalizedRoute = normalizeRoute(route)

  return pathname === normalizedRoute || pathname.startsWith(`${normalizedRoute}/`)
}

export function isInternalCypressRoute (pathname: string, config: InternalRouteConfig): boolean {
  // Component-testing app/spec assets are served by the bundler under
  // /__cypress/src (or a custom public path). Matching the whole namespace
  // would incorrectly loop those requests back to Express.
  if (config.devServerPublicPathRoute && matchesPathPrefix(pathname, config.devServerPublicPathRoute)) {
    return false
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
