import type { ResourceType } from './external-types'

/** Serializable wire payload shared between {@link HttpInterception} and the driver. */
export type InterceptWireBaseMessage<T = any> = {
  body: T
  headers: { [key: string]: string | string[] }
}

export type InterceptWireRequest<T = any> = InterceptWireBaseMessage<T> & {
  method: string
  url: string
  query: Record<string, string | number>
  httpVersion: string
  resourceType: ResourceType
  responseTimeout?: number
  followRedirect?: boolean
  alias?: string
}

export type InterceptWireResponse<T = any> = InterceptWireBaseMessage<T> & {
  statusCode: number
  statusMessage: string
  throttleKbps?: number
  delay?: number
}

export type InterceptWireResponseComplete<T = any> = {
  finalResBody?: InterceptWireBaseMessage<T>['body']
}

export type InterceptWireNetworkError = {
  error: any
}
