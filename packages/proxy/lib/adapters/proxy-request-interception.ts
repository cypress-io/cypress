import type { ForRequestInterception } from '@packages/network-interception'
import { correlateBrowserPreRequest } from './correlate-browser-pre-request'
import { sendRequestOutgoing } from './send-request-outgoing'
import type { RequestInterceptionMiddlewareCtx } from './types'

/** {@link ForRequestInterception} adapter — delegates to legacy proxy request middleware. */
export class ProxyRequestInterceptionAdapter implements ForRequestInterception {
  correlateBrowserPreRequest (ctx: unknown): Promise<void> {
    return correlateBrowserPreRequest(ctx as RequestInterceptionMiddlewareCtx)
  }

  forwardToOrigin (ctx: unknown): void {
    sendRequestOutgoing(ctx as RequestInterceptionMiddlewareCtx)
  }
}
