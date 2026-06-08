import type {
  InterceptWireBaseMessage,
  InterceptWireNetworkError,
  InterceptWireRequest,
  InterceptWireResponse,
  InterceptWireResponseComplete,
  StaticResponse,
} from '@packages/network-interception'

export namespace CyHttpMessages {
  export type BaseMessage<T = any> = InterceptWireBaseMessage<T>

  export type IncomingResponse<T = any> = InterceptWireResponse<T>

  export type IncomingHttpResponse<T = any> = IncomingResponse<T> & {
    /**
     * Continue the HTTP response, merging the supplied values with the real response.
     */
    send(status: number, body?: string | number | object, headers?: { [key: string]: string }): void
    send(body: string | object, headers?: { [key: string]: string }): void
    send(staticResponse: StaticResponse): void
    /**
     * Continue the HTTP response to the browser, including any modifications made to `res`.
     */
    send(): void
    /**
     * Wait for `delay` milliseconds before sending the response to the client.
     */
    setDelay: (delay: number) => IncomingHttpResponse<T>
    /**
     * Serve the response at `throttleKbps` kilobytes per second.
     */
    setThrottle: (throttleKbps: number) => IncomingHttpResponse<T>
  }

  export type IncomingRequest<T = any> = InterceptWireRequest<T>

  export interface IncomingHttpRequest<TRequest = any, TResponse = any> extends IncomingRequest<TRequest>, RequestEvents<TResponse> {
    /**
     * Destroy the request and respond with a network error.
     */
    destroy(): void
    /**
     * Send the request outgoing, skipping any other request handlers.
     * If a function is passed, the request will be sent outgoing, and the function will be called
     * with the response from the upstream server.
     */
    continue(interceptor?: HttpResponseInterceptor<TResponse>): void
    /**
     * Control the response to this request.
     * If a function is passed, the request will be sent outgoing, and the function will be called
     * with the response from the upstream server.
     * If a `StaticResponse` is passed, it will be used as the response, and no request will be made
     * to the upstream server.
     */
    reply(interceptor?: StaticResponse | HttpResponseInterceptor<TResponse>): void
    /**
     * Shortcut to reply to the request with a body and optional headers.
     */
    reply(body: string | object, headers?: { [key: string]: string }): void
    /**
     * Shortcut to reply to the request with an HTTP status code and optional body and headers.
     */
    reply(status: number, body?: string | object, headers?: { [key: string]: string }): void
    /**
     * Respond to this request with a redirect to a new `location`.
     * @param statusCode HTTP status code to redirect with. Default: 302
     */
    redirect(location: string, statusCode?: number): void
  }

  export type ResponseComplete<T = any> = InterceptWireResponseComplete<T>

  export type NetworkError = InterceptWireNetworkError
}

/**
 * Interceptor for an HTTP request. If a Promise is returned, it will be awaited before passing the
 * request to the next handler (if there is one), otherwise the request will be passed to the next
 * handler synchronously.
 */
export type HttpRequestInterceptor<TRequest = any, TResponse = any> = (req: CyHttpMessages.IncomingHttpRequest<TRequest, TResponse>) => void | Promise<void>

/**
 * Interceptor for an HTTP response. If a Promise is returned, it will be awaited before passing the
 * request to the next handler (if there is one), otherwise the request will be passed to the next
 * handler synchronously.
 */
export type HttpResponseInterceptor<T = any> = (res: CyHttpMessages.IncomingHttpResponse<T>) => void | Promise<void>

interface RequestEvents<T> {
  /**
   * Emitted before `response` and before any `req.continue` handlers.
   * Modifications to `res` will be applied to the incoming response.
   * If a promise is returned from `cb`, it will be awaited before processing other event handlers.
   */
  on(eventName: 'before:response', cb: HttpResponseInterceptor<T>): this
  /**
   * Emitted after `before:response` and after any `req.continue` handlers - before the response is sent to the browser.
   * Modifications to `res` will be applied to the incoming response.
   * If a promise is returned from `cb`, it will be awaited before processing other event handlers.
   */
  on(eventName: 'response', cb: HttpResponseInterceptor<T>): this
  /**
   * Emitted once the response to a request has finished sending to the browser.
   * Modifications to `res` have no impact.
   * If a promise is returned from `cb`, it will be awaited before processing other event handlers.
   */
  on(eventName: 'after:response', cb: (res: CyHttpMessages.IncomingResponse<T>) => void | Promise<void>): this
}
