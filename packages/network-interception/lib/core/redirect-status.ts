const REDIRECT_STATUS_CODES: ReadonlySet<number> = new Set([301, 302, 303, 307, 308])

/**
 * Whether a browser follows the response's Location header. The proxy and the
 * CDP transport both use this, so they agree on which responses are redirects.
 */
export function isRedirectStatus (statusCode: number | undefined): boolean {
  return statusCode !== undefined && REDIRECT_STATUS_CODES.has(statusCode)
}
