import type { Request } from 'express'
import type { CorsOptions, CorsOptionsDelegate } from 'cors'
import { isLocalhost } from '@packages/network-tools'

import { CLOUD_URLS } from '../src/util/cloudUrls'

const CYPRESS_CLOUD_ORIGINS: ReadonlySet<string> = new Set([
  CLOUD_URLS.development,
  CLOUD_URLS.staging,
  CLOUD_URLS.production,
])

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

export const corsOriginDelegate: CorsOptionsDelegate<Request> = (req, callback) => {
  const origin = req.headers.origin
  const allowed: CorsOptions = { origin: true }
  const denied: CorsOptions = { origin: false }

  if (isOriginAllowed(origin, req.socket.localPort)) {
    return callback(null, allowed)
  }

  if (origin && req.path === '/cloud-notification' && CYPRESS_CLOUD_ORIGINS.has(origin)) {
    return callback(null, allowed)
  }

  return callback(null, denied)
}
