import type { Readable } from 'stream'
import type { ResourceType } from '../types/external-types'

export type HttpHeaders = Record<string, string | string[]>

export type HttpRequest = {
  inFlightInterceptId: string
  browserRequestId?: string
  url: string
  method: string
  headers: HttpHeaders
  body?: string | Buffer
  requestBodyMaterialized?: boolean
  materializeRequestBody?: () => Promise<string | Buffer | undefined>
  materializeOriginResponse?: boolean
  resourceType?: ResourceType
  isSyncRequest?: boolean
  responseTimeout?: number
  followRedirect?: boolean
  hadIntercept?: boolean
  browserAcceptEncoding?: string
}

export type HttpResponse = {
  statusCode: number
  statusMessage?: string
  headers: HttpHeaders
  body?: string | Buffer
  delay?: number
  throttleKbps?: number
  stream?: () => Promise<Readable>
  onResponseWrittenToClient?: () => Promise<void>
}

export interface ForOriginForwarding {
  (request: HttpRequest): Promise<HttpResponse>
}

export type InterceptMiddleware = (
  request: HttpRequest,
  next: ForOriginForwarding,
) => Promise<HttpResponse>

export type TransportNext<TRequest, TResponse> = (
  request: TRequest,
) => Promise<TResponse>

export interface HttpTransportCodec<TRequest, TResponse> {
  decodeRequest (request: TRequest): HttpRequest
  applyRequest (transportRequest: TRequest, request: HttpRequest): void | Promise<void>
  decodeResponse (response: TResponse): HttpResponse
  encodeResponse (response: HttpResponse): TResponse | Promise<TResponse>
}

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
