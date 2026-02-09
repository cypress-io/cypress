/**
 * Returns the Accept-Encoding value Cypress should use when making HTTP requests.
 * Cypress supports plaintext, gzip, and Brotli. This filters a client's
 * accept-encoding header down to only encodings we support (br, gzip, identity).
 *
 * @param acceptEncoding - The raw accept-encoding header value, or undefined if absent.
 * @returns A comma-separated string of supported encodings, or 'identity' if none supported.
 */
export function getSupportedAcceptEncoding (acceptEncoding: string | undefined): string {
  if (acceptEncoding) {
    const supported: string[] = []

    if (acceptEncoding.includes('br')) supported.push('br')

    if (acceptEncoding.includes('gzip')) supported.push('gzip')

    return supported.length ? supported.join(',') : 'identity'
  }

  // If there is no accept-encoding header, RFC 9110 means the client accepts everything.
  // We explicitly filter that down to gzip and identity (Cypress does not send br by default here).
  return 'gzip,identity'
}
