import type { Request } from 'express'
import type { CorsOptions, CorsOptionsDelegate } from 'cors'
import { isLocalhost } from '@packages/network-tools'

import { CLOUD_URLS, resolveCloudEnv, resolveCloudUrl } from '../src/util/cloudUrls'

function isOwnOrigin (origin: string, expectedPort: number): boolean {
  try {
    const url = new URL(origin)

    return isLocalhost(url) && url.port === String(expectedPort)
  } catch {
    return false
  }
}

export function isOriginAllowed (origin: string | undefined, expectedPort: number | undefined): boolean {
  if (!origin) {
    return true
  }

  if (!expectedPort) {
    return false
  }

  return isOwnOrigin(origin, expectedPort)
}

// Requests without an Origin, such as same-origin GETs, carry nothing else to
// check, so Host must name localhost on the server's port.
export function isHostAllowed (host: string | undefined, expectedPort: number | undefined): boolean {
  if (!host || !expectedPort) {
    return false
  }

  return isOwnOrigin(`http://${host}`, expectedPort)
}

export const corsOriginDelegate: CorsOptionsDelegate<Request> = (req, callback) => {
  const origin = req.headers.origin
  const allowed: CorsOptions = { origin: true }
  const denied: CorsOptions = { origin: false }

  if (isOriginAllowed(origin, req.socket.localPort)) {
    return callback(null, allowed)
  }

  const isCloudNotification = origin !== undefined && req.path === '/cloud-notification'

  if (isCloudNotification) {
    const apiEnvironment = process.env.CYPRESS_CONFIG_ENV || process.env.CYPRESS_INTERNAL_ENV || 'development'
    // The API can direct notifications to a local dashboard even when GraphQL uses staging.
    const usesDevelopmentService = resolveCloudEnv() === 'development' || apiEnvironment === 'development'
    const developmentOrigin = usesDevelopmentService ? resolveCloudUrl('development') : CLOUD_URLS.development
    const isCypressCloudOrigin = origin === developmentOrigin || origin === CLOUD_URLS.staging || origin === CLOUD_URLS.production

    if (isCypressCloudOrigin) {
      return callback(null, allowed)
    }
  }

  return callback(null, denied)
}
