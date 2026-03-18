declare module '@cypress/request-promise' {
  import type request from 'request'
  import type BluebirdPromise from 'bluebird'

  namespace requestPromise {
    // RequestPromise is actually a Bluebird promise at runtime, so it has all Bluebird methods
    // We extend request.Request for compatibility but the actual value is a BluebirdPromise
    interface RequestPromise<T = any> extends request.Request, BluebirdPromise<T> {
      // Keep these for explicit typing, but BluebirdPromise already has them
      then: BluebirdPromise<T>['then']
      catch: BluebirdPromise<T>['catch']
      finally: BluebirdPromise<T>['finally']
      cancel: BluebirdPromise<T>['cancel']
      promise(): BluebirdPromise<T>
      // Explicitly declare timeout as a method (not a property) to match runtime behavior
      timeout(ms: number, message?: string | Error): RequestPromise<T>
    }

    interface RequestPromiseOptions extends request.CoreOptions {
      simple?: boolean | undefined
      transform?(body: any, response: request.Response, resolveWithFullResponse?: boolean): any
      transform2xxOnly?: boolean | undefined
      resolveWithFullResponse?: boolean | undefined
      agent?: CombinedAgent | null
    }

    type RequestPromiseAPI<T = any> = request.RequestAPI<
      RequestPromise<T>,
      RequestPromiseOptions,
      request.RequiredUriUrl
    > & {
      // Support for defaults() with a function parameter (extension pattern)
      defaults(
        fn: (params: RequestPromiseOptions, callback?: request.RequestCallback) => BluebirdPromise<any>
      ): RequestPromiseAPI
    }

    type OptionsWithUri = request.UriOptions & RequestPromiseOptions
    type OptionsWithUrl = request.UrlOptions & RequestPromiseOptions
    type Options = OptionsWithUri | OptionsWithUrl
  }

  const requestPromise: requestPromise.RequestPromiseAPI
  export = requestPromise
}

declare module '@cypress/request-promise/errors' {
  import http = require('http')
  import rp = require('@cypress/request-promise')

  export interface RequestError extends Error {
    name: 'RequestError'
    cause: any
    error: any
    options: rp.Options
    response: http.IncomingMessage
  }

  export interface RequestErrorConstructor {
    new (cause: any, options: rp.Options, response: http.IncomingMessage): RequestError
    (cause: any, options: rp.Options, response: http.IncomingMessage): RequestError
    prototype: RequestError
  }

  export const RequestError: RequestErrorConstructor

  export interface StatusCodeError extends Error {
    name: 'StatusCodeError'
    statusCode: number
    error: any
    options: rp.Options
    response: http.IncomingMessage
  }

  export interface StatusCodeErrorConstructor extends Error {
    new (statusCode: number, body: any, options: rp.Options, response: http.IncomingMessage): StatusCodeError
    (statusCode: number, body: any, options: rp.Options, response: http.IncomingMessage): StatusCodeError
    prototype: StatusCodeError
  }

  export const StatusCodeError: StatusCodeErrorConstructor

  export interface TransformError extends Error {
    name: 'TransformError'
    cause: any
    error: any
    options: rp.Options
    response: http.IncomingMessage
  }

  export interface TransformErrorConstructor extends Error {
    new (cause: any, options: rp.Options, response: http.IncomingMessage): TransformError
    (cause: any, options: rp.Options, response: http.IncomingMessage): TransformError
    prototype: TransformError
  }

  export const TransformError: TransformErrorConstructor
}
