import type { InterceptMiddleware } from '../ports/http-interception'
import type { CspAllowListConfig } from '../csp/strip-csp-headers'
import { applyCspAllowListToHeaders } from '../csp/strip-csp-headers'

/**
 * Response middleware: strip or rewrite CSP headers after fulfillment.
 */
export function createCspConfiguredAllowList (
  config: CspAllowListConfig,
): InterceptMiddleware {
  return async (request, next) => {
    const response = await next(request)

    return {
      ...response,
      headers: applyCspAllowListToHeaders(response.headers, config),
    }
  }
}
