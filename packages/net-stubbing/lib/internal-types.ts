import * as _ from 'lodash'
import {
  RouteMatcherOptionsGeneric,
  GenericStaticResponse,
  Subscription,
} from './external-types'

export type FixtureOpts = {
  encoding: string
  filePath: string
}

export type BackendStaticResponse = GenericStaticResponse<FixtureOpts, string>

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
  'delayMs',
  'throttleKbps',
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

export declare namespace NetEvent {
  export interface Http {
    requestId: string
    routeHandlerId: string
  }

  export namespace ToDriver {
    export interface Event<D> extends Http {
      subscription: Subscription
      eventId: string
      data: D
    }
  }

  export namespace ToServer {
    export interface AddRoute {
      routeMatcher: AnnotatedRouteMatcherOptions
      staticResponse?: BackendStaticResponse
      hasInterceptor: boolean
      handlerId?: string
    }

    export interface Subscribe {
      requestId: string
      subscription: Subscription
    }

    export interface EventHandlerResolved {
      eventId: string
      changedData: any
    }

    export interface SendStaticResponse {
      requestId: string
      staticResponse: BackendStaticResponse
    }
  }
}
