import type { Request } from 'express'
import type { CorsOptions, CorsOptionsDelegate } from 'cors'
import { isLocalhost } from '@packages/network-tools'

import { CLOUD_URLS } from '../src/util/cloudUrls'

const CYPRESS_CLOUD_ORIGINS: ReadonlySet<string> = new Set([CLOUD_URLS.production, CLOUD_URLS.staging])

function isLocalhostOrigin (origin: string): boolean {
  try {
    return isLocalhost(new URL(origin))
  } catch {
    return false
  }
}

export function isOriginAllowed (origin: string | undefined): boolean {
  if (!origin) {
    return true
  }

  return isLocalhostOrigin(origin)
}

export const corsOriginDelegate: CorsOptionsDelegate<Request> = (req, callback) => {
  const origin = req.headers.origin
  const allowed: CorsOptions = { origin: true }
  const denied: CorsOptions = { origin: false }

  if (isOriginAllowed(origin)) {
    return callback(null, allowed)
  }

  if (origin && req.path === '/cloud-notification' && CYPRESS_CLOUD_ORIGINS.has(origin)) {
    return callback(null, allowed)
  }

  return callback(null, denied)
}
