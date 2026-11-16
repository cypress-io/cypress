import type { ForNetworkCapture } from '@packages/network-interception'
import { notifyResponseEndedWithEmptyBody, notifyResponseStreamReceived } from './network-capture'
import type { ResponseInterceptionMiddlewareCtx } from './types'

/** {@link ForNetworkCapture} adapter — delegates to legacy proxy protocol capture hooks. */
export class ProxyNetworkCaptureAdapter implements ForNetworkCapture {
  notifyResponseStreamReceived (ctx: unknown): Promise<void> {
    return notifyResponseStreamReceived(ctx as ResponseInterceptionMiddlewareCtx)
  }

  notifyResponseEndedWithEmptyBody (ctx: unknown, options: { isCached: boolean }): void {
    return notifyResponseEndedWithEmptyBody(ctx as ResponseInterceptionMiddlewareCtx, options)
  }
}
