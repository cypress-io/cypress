import type { ForCookieState } from '@packages/network-policy'
import { attachCrossOriginCookies } from './attach-cross-origin-cookies'
import { copyCookiesFromResponse } from './copy-cookies-from-response'
import type { RequestInterceptionMiddlewareCtx, ResponseInterceptionMiddlewareCtx } from './types'

/** {@link ForCookieState} adapter — delegates to legacy proxy cookie jar middleware. */
export class ProxyCookieStateAdapter implements ForCookieState {
  attachCrossOriginCookies (ctx: unknown): Promise<void> {
    return attachCrossOriginCookies(ctx as RequestInterceptionMiddlewareCtx)
  }

  copyCookiesFromResponse (ctx: unknown): Promise<void> {
    return copyCookiesFromResponse(ctx as ResponseInterceptionMiddlewareCtx)
  }
}
