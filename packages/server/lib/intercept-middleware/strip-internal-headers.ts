import _ from 'lodash'
import type { HttpRequest, HttpResponse, InterceptMiddleware, ForOriginForwarding } from '@packages/network-interception'

export function createStripInternalHeaders (
  headers: readonly string[],
): InterceptMiddleware {
  return async (request: HttpRequest, next: ForOriginForwarding): Promise<HttpResponse> => {
    const stashed = { ..._.pick(request.headers, headers) }

    request.headers = _.omit(request.headers, headers)
    const response = await next(request)

    response.headers = { ...response.headers, ...stashed }

    return response
  }
}
