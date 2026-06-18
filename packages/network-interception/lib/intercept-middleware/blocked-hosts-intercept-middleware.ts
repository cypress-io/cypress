import type { InterceptMiddleware } from '../ports/http-interception'

export type BlockedHostsConfig = {
  /**
   * Live config object shared with the proxy runtime.
   * `blockHosts` is read at enforcement time, not snapshot at registration.
   */
  config: { blockHosts?: string | string[] | null }
  /**
   * Host matcher injected by the composition root (e.g. `blocked.matches` from proxy).
   * Keeps `@packages/network-interception` free of proxy dependencies.
   */
  matchesBlockedHost?: (url: string, blockHosts: string | string[]) => string | false | null | undefined
}

/**
 * Config middleware: return 503 when `blockHosts` matches the request URL.
 *
 * Registered on {@link HttpIntercept} before the cy.intercept intercepter.
 */
export function createBlockedHostsInterceptMiddleware (
  options: BlockedHostsConfig,
): InterceptMiddleware {
  return async (request, next) => {
    const blockHosts = options.config.blockHosts

    if (!blockHosts || !options.matchesBlockedHost) {
      return next(request)
    }

    const match = options.matchesBlockedHost(request.url, blockHosts)

    if (!match) {
      return next(request)
    }

    return {
      statusCode: 503,
      headers: {
        'x-cypress-matched-blocked-host': match,
      },
      body: '',
    }
  }
}
