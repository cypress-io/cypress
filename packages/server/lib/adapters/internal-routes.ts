type InternalRouteConfig = {
  clientRoute: string
  namespace: string
  port: number | null
  proxyUrl?: string
  socketIoRoute: string
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
  const namespaceRoute = `/${config.namespace}`
  const internalRoutes = [
    namespaceRoute,
    config.clientRoute,
    config.socketIoRoute,
    `${config.socketIoRoute}-graphql`,
    '/__cypress-studio',
    '/__cypress-cy-prompt',
  ]

  return internalRoutes.some((route) => matchesPathPrefix(pathname, route))
}

export function isCypressServerOrigin (requestUrl: string, config: InternalRouteConfig): boolean {
  if (!config.port) {
    return false
  }

  const serverUrl = new URL(config.proxyUrl ?? `http://localhost:${config.port}`)
  const url = new URL(requestUrl, serverUrl)

  if (url.port !== String(config.port)) {
    return false
  }

  return url.hostname === serverUrl.hostname || LOCALHOST_NAMES.has(url.hostname)
}
