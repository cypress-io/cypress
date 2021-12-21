import * as _ from 'lodash'
import type {
  RouteMatcherOptionsGeneric,
  GenericStaticResponse,
  Subscription,
  CyHttpMessages,
} from './external-types'

export type FixtureOpts = {
  encoding: string | null
  filePath: string
}

export type BackendStaticResponse = GenericStaticResponse<FixtureOpts, string>

export type BackendStaticResponseWithArrayBuffer = GenericStaticResponse<FixtureOpts, string | ArrayBuffer>

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
  'delay',
  'throttleKbps',
)

export const PLAIN_FIELDS: (keyof RouteMatcherOptionsGeneric<any>)[] = ['https', 'port', 'middleware', 'times']

export const DICT_STRING_MATCHER_FIELDS: (keyof RouteMatcherOptionsGeneric<any>)[] = ['headers', 'query']

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

export declare namespace NetEvent {
  export interface Http {
    requestId: string
  }

  export namespace ToDriver {
    export interface Event<D> extends Http {
      /**
       * If set, this is the browser's internal identifier for this request.
       */
      browserRequestId?: string
      subscription: Subscription
      eventId: string
      data: D
    }

    export interface Response extends Event<CyHttpMessages.IncomingResponse> {}
  }

  export namespace ToServer {
    export interface AddRoute<StaticResponse> {
      routeMatcher: AnnotatedRouteMatcherOptions
      staticResponse?: StaticResponse
      hasInterceptor: boolean
      routeId: string
    }

    export interface Subscribe {
      requestId: string
      subscription: Subscription
    }

    export interface EventHandlerResolved {
      eventId: string
      changedData: any
      /**
       * If `true`, no further handlers for this event will be called.
       */
      stopPropagation: boolean
    }

    export interface SendStaticResponse {
      requestId: string
      staticResponse: BackendStaticResponse
    }
  }
}
