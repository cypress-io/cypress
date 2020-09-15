import * as _ from 'lodash'
import {
  RouteMatcherOptionsGeneric,
  CyHttpMessages,
  GenericStaticResponse,
} from './external-types'

export type FixtureOpts = {
  encoding: string
  filePath: string
}

export type BackendStaticResponse = GenericStaticResponse<FixtureOpts, string> & {
  // Millisecond timestamp for when the response should continue
  continueResponseAt?: number
}

export const SERIALIZABLE_REQ_PROPS = [
  'headers',
  'body', // doesn't exist on the OG message, but will be attached by the backend
  'url',
  'method',
  'httpVersion',
  'responseTimeout',
  'followRedirect',
]

export const SERIALIZABLE_RES_PROPS = _.concat(
  SERIALIZABLE_REQ_PROPS,
  'statusCode',
  'statusMessage',
)

export const DICT_STRING_MATCHER_FIELDS = ['headers', 'query']

export const STRING_MATCHER_FIELDS = ['auth.username', 'auth.password', 'hostname', 'method', 'path', 'pathname', 'url']

/**
 * Serializable `StringMatcher` type.
 */
export interface AnnotatedStringMatcher {
  type: 'regex' | 'glob'
  value: string
}

/**
 * Serializable `RouteMatcherOptions` type.
 */
export type AnnotatedRouteMatcherOptions = RouteMatcherOptionsGeneric<AnnotatedStringMatcher>

/** Types for messages between driver and server */

export declare namespace NetEventFrames {
  export interface AddRoute {
    routeMatcher: AnnotatedRouteMatcherOptions
    staticResponse?: BackendStaticResponse
    hasInterceptor: boolean
    handlerId?: string
  }

  interface BaseHttp {
    requestId: string
    routeHandlerId: string
  }

  // fired when HTTP proxy receives headers + body of request
  export interface HttpRequestReceived extends BaseHttp {
    req: CyHttpMessages.IncomingRequest
    /**
     * Is the proxy expecting the driver to send `HttpRequestContinue`?
     */
    notificationOnly: boolean
  }

  // fired when driver is done modifying request and wishes to pass control back to the proxy
  export interface HttpRequestContinue extends BaseHttp {
    req: CyHttpMessages.IncomingRequest
    staticResponse?: BackendStaticResponse
    hasResponseHandler?: boolean
    tryNextRoute?: boolean
  }

  // fired when a response is received and the driver has a req.reply callback registered
  export interface HttpResponseReceived extends BaseHttp {
    res: CyHttpMessages.IncomingResponse
  }

  // fired when driver is done modifying response or driver callback completes,
  // passes control back to proxy
  export interface HttpResponseContinue extends BaseHttp {
    res?: CyHttpMessages.IncomingResponse
    staticResponse?: BackendStaticResponse
    // Millisecond timestamp for when the response should continue
    continueResponseAt?: number
    throttleKbps?: number
    followRedirect?: boolean
  }

  // fired when a response has been sent completely by the server to an intercepted request
  export interface HttpRequestComplete extends BaseHttp {
    error?: Error & { code?: string }
  }
}
