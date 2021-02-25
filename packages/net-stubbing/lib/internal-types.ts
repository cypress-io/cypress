import * as _ from 'lodash'
import {
  RouteMatcherOptionsGeneric,
  CyHttpMessages,
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

  export interface Subscription {
    subscriptionId: string
  }

  export namespace ToDriver {
    interface Event<D> extends Http {
      data: D
    }

    export interface Request extends Event<CyHttpMessages.IncomingRequest> {}

    interface SubscriptionEvent<D> extends Event<D>, Subscription {}

    export interface Response extends SubscriptionEvent<CyHttpMessages.IncomingResponse> {}
  }

  export namespace ToServer {
    export interface AddRoute {
      routeMatcher: AnnotatedRouteMatcherOptions
      staticResponse?: BackendStaticResponse
      hasInterceptor: boolean
      handlerId?: string
    }

    export interface Subscribe extends Http {
      subscription: Subscription
    }

    export interface SubscriptionHandlerResolved extends Http, Subscription {
      changedData: any
    }

    export interface SendStaticResponse extends Http {
      staticResponse: BackendStaticResponse
    }
  }
}
