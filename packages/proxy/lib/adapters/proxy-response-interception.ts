import type { ForResponseInterception } from '@packages/network-interception'
import { handleInterceptResponse } from '@packages/net-stubbing'
import type { ResponseInterceptionMiddlewareCtx } from './types'

/** {@link ForResponseInterception} adapter — delegates to legacy net-stubbing response middleware. */
export class ProxyResponseInterceptionAdapter implements ForResponseInterception {
  interceptResponse (ctx: unknown): Promise<void> {
    return handleInterceptResponse(ctx as ResponseInterceptionMiddlewareCtx)
  }
}
