const SUPPORTED = new Set(['br', 'gzip'])

/**
 * Returns the Accept-Encoding value Cypress should use when making HTTP requests.
 * Cypress supports plaintext, gzip, and Brotli. This filters a client's
 * accept-encoding header down to only encodings we support (br, gzip, identity),
 * preserving the client's order, q-values, and matching whole tokens only
 * (e.g. "gzip" does not match "x-gzip"). The token is the part before the first ';'.
 *
 * @param acceptEncoding - The raw accept-encoding header value, or undefined if absent.
 * @returns A comma-separated string of supported encodings, or 'identity' if none supported.
 */
export function getSupportedAcceptEncoding (acceptEncoding: string | undefined): string {
  const trimmed = acceptEncoding?.trim()

  if (trimmed) {
    const supported: string[] = []
    const seen = new Set<string>()

    for (const part of trimmed.split(',')) {
      const partTrimmed = part.trim()
      const token = partTrimmed.split(';')[0].trim().toLowerCase()

      if (SUPPORTED.has(token) && !seen.has(token)) {
        seen.add(token)
        supported.push(partTrimmed)
      }
    }

    return supported.length ? supported.join(',') : 'identity'
  }

  // If there is no accept-encoding header, RFC 9110 means the client accepts everything.
  // We explicitly filter that down to gzip and identity (Cypress does not send br by default here).
  return 'gzip,identity'
}
