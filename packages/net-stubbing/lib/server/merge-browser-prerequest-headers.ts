import type { CypressIncomingRequest } from '@packages/proxy'
import { caseInsensitiveHas } from '../util'

/**
 * Fetch pauses sometimes omit header fields that CDP already reported on
 * `Network.requestWillBeSent` (e.g. `Content-Type` on XHR POST). Merge those
 * in so `req.headers` matches the MITM path and driver-side JSON parsing runs.
 */
export function mergeMissingHeadersFromBrowserPreRequest (req: CypressIncomingRequest): void {
  const preHeaders = req.browserPreRequest?.headers

  if (!preHeaders) {
    return
  }

  if (!req.headers) {
    req.headers = {}
  }

  for (const [name, value] of Object.entries(preHeaders)) {
    if (value === undefined) {
      continue
    }

    const lower = name.toLowerCase()

    if (caseInsensitiveHas(req.headers, lower)) {
      continue
    }

    req.headers[lower] = Array.isArray(value) ? value.join(', ') : String(value)
  }
}
