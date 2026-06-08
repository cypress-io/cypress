import _ from 'lodash'
import type { HttpRequest, HttpResponse } from '../ports/http-interception'
import type { InterceptWireRequest, InterceptWireResponse } from '../types/intercept-wire'
import { SERIALIZABLE_REQ_PROPS, SERIALIZABLE_RES_PROPS } from '../types/internal-types'

/**
 * Test parity stub for {@link HttpInterceptionOptions.wireMessages}.
 * Production wiring uses net-stubbing's {@link http-handler-conversion}.
 */
export function createTestWireMessages () {
  return {
    toWireRequest (request: HttpRequest): InterceptWireRequest {
      return _.extend(_.pick(request, SERIALIZABLE_REQ_PROPS), {
        url: request.url,
        body: request.body ?? '',
      }) as InterceptWireRequest
    },

    toWireResponse (response: HttpResponse, requestUrl: string): InterceptWireResponse {
      return _.extend(_.pick(response, SERIALIZABLE_RES_PROPS), {
        url: requestUrl,
        body: response.body ?? '',
      }) as InterceptWireResponse
    },

    applyWireRequestToHttpRequest (
      httpRequest: HttpRequest,
      wireRequest: InterceptWireRequest,
      resolvedUrl: string,
    ): void {
      httpRequest.url = resolvedUrl
      httpRequest.method = wireRequest.method
      httpRequest.headers = wireRequest.headers
      httpRequest.body = wireRequest.body
      httpRequest.responseTimeout = wireRequest.responseTimeout
      httpRequest.followRedirect = wireRequest.followRedirect
    },
  }
}
