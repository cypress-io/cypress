import _ from 'lodash'
import type { BackendStaticResponse } from '../types/internal-types'
import type { GetFixtureFn } from '../types/backend-route'
import type { HttpResponse } from '../ports/http-interception'
import { resolveStaticResponseFixture } from './resolve-static-response-fixture'

/**
 * Build a materialized {@link HttpResponse} from a route static stub or driver reply.
 */
export async function buildHttpResponseFromStatic (
  staticResponse: BackendStaticResponse,
  getFixture: GetFixtureFn,
): Promise<HttpResponse> {
  const response = _.cloneDeep(staticResponse)

  if (response.fixture && _.isUndefined(response.body)) {
    await resolveStaticResponseFixture(response, getFixture)
  }

  return {
    statusCode: response.statusCode || 200,
    statusMessage: (response as HttpResponse).statusMessage,
    headers: response.headers || {},
    body: _.isUndefined(response.body) ? '' : response.body,
    delay: response.delay,
    throttleKbps: response.throttleKbps,
  }
}

export function buildPreflightHttpResponse (request: {
  headers: Record<string, string | string[]>
}): HttpResponse {
  return {
    statusCode: 204,
    headers: {
      'access-control-max-age': '-1',
      'access-control-allow-credentials': 'true',
      'access-control-allow-origin': (request.headers.origin as string) || '*',
      'access-control-allow-methods': (request.headers['access-control-request-method'] as string) || '*',
      'access-control-allow-headers': (request.headers['access-control-request-headers'] as string) || '*',
    },
    body: '',
  }
}
