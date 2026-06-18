import type { ResourceType } from '@packages/network-interception'

/** Serializable payload sent to the driver over the socket. */
export type DriverInterceptMessage<T = any> = {
  body: T
  headers: { [key: string]: string | string[] }
}

export type DriverInterceptRequest<T = any> = DriverInterceptMessage<T> & {
  method: string
  url: string
  query: Record<string, string | number>
  httpVersion: string
  resourceType: ResourceType
  responseTimeout?: number
  followRedirect?: boolean
  alias?: string
}

export type DriverInterceptResponse<T = any> = DriverInterceptMessage<T> & {
  statusCode: number
  statusMessage: string
  throttleKbps?: number
  delay?: number
}

export type DriverInterceptResponseComplete<T = any> = {
  finalResBody?: DriverInterceptMessage<T>['body']
}

export type DriverInterceptNetworkError = {
  error: any
}
