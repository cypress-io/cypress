import type { Readable } from 'stream'
import type { ResourceType } from '../types/external-types'

export type HttpHeaders = Record<string, string | string[] | undefined>

export type HttpBody = string | Buffer

export type HttpRequest = {
  id: string
  url: string
  method?: string
  headers?: HttpHeaders
  body?: HttpBody
  resourceType?: ResourceType
}

export type HttpResponse = {
  id: string
  url: string
  body?: HttpBody
  bodySkipped?: boolean
  bodyStream?: Readable
  /**
   * A live stream of the bytes the browser actually delivered for a
   * stream-classified response (decoded for CDP capture, fulfilled bytes for
   * stubbed responses). Threaded through to Test Replay capture separately
   * from `bodyStream`, which the middleware body path must keep untouched.
   */
  captureStream?: Readable
  headers?: HttpHeaders
  statusCode?: number
}

export interface TransportCodecPort<TRequest, TResponse> {
  encodeRequest (request: HttpRequest): TRequest
  decodeRequest (request: TRequest): HttpRequest
  encodeResponse (response: HttpResponse): TResponse
  decodeResponse (response: TResponse): HttpResponse
  releaseRequest? (id: string): void
}

export type InterceptMiddleware = (
  request: HttpRequest,
  next: (request: HttpRequest) => Promise<HttpResponse>,
) => Promise<HttpResponse>

export type TransportNext<TRequest, TResponse> = (
  request: TRequest,
) => Promise<TResponse>

export interface ForHttpIntercept<TRequest, TResponse> {
  handle (
    request: TRequest,
    next: TransportNext<TRequest, TResponse>,
  ): Promise<TResponse>
  use (middleware: InterceptMiddleware): void
}

export type ForNetworkInterception<TRequest, TResponse> = Pick<
ForHttpIntercept<TRequest, TResponse>,
'handle'
>
