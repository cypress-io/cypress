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
