import type { RequestMiddleware } from '../http/request-middleware'
import type { ResponseMiddleware } from '../http/response-middleware'

export type RequestInterceptionMiddlewareCtx = RequestMiddleware extends (this: infer T) => any ? T : never

export type ResponseInterceptionMiddlewareCtx = ResponseMiddleware extends (this: infer T) => any ? T : never
