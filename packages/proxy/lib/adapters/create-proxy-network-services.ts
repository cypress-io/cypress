import type { ProxyNetworkServices } from '../http'
import type { RequestInterceptionMiddlewareCtx, ResponseInterceptionMiddlewareCtx } from './types'
import { attachCrossOriginCookies } from './attach-cross-origin-cookies'
import { copyCookiesFromResponse } from './copy-cookies-from-response'
import { injectHtml } from './inject-html'
import { notifyResponseEndedWithEmptyBody, notifyResponseStreamReceived } from './network-capture'
import { removeSecurity } from './remove-security'
import { sendToDriver } from './send-to-driver'
import { setInjectionLevel } from './set-injection-level'

export function createProxyNetworkServices (): ProxyNetworkServices {
  return {
    commandLog: {
      notifyIncomingRequest (ctx: unknown): void {
        sendToDriver(ctx as RequestInterceptionMiddlewareCtx)
      },
      logInterception () {
        return undefined
      },
    },
    cookieState: {
      attachCrossOriginCookies (ctx: unknown): Promise<void> {
        attachCrossOriginCookies(ctx as RequestInterceptionMiddlewareCtx)

        return Promise.resolve()
      },
      copyCookiesFromResponse (ctx: unknown): Promise<void> {
        return copyCookiesFromResponse(ctx as ResponseInterceptionMiddlewareCtx)
      },
    },
    documentPreparation: {
      setInjectionLevel (ctx: unknown): Promise<void> {
        return setInjectionLevel(ctx as ResponseInterceptionMiddlewareCtx)
      },
      injectHtml (ctx: unknown): Promise<void> {
        return injectHtml(ctx as ResponseInterceptionMiddlewareCtx)
      },
      removeSecurity (ctx: unknown): Promise<void> {
        return removeSecurity(ctx as ResponseInterceptionMiddlewareCtx)
      },
    },
    networkCapture: {
      notifyResponseStreamReceived (ctx: unknown): Promise<void> {
        return notifyResponseStreamReceived(ctx as ResponseInterceptionMiddlewareCtx)
      },
      notifyResponseEndedWithEmptyBody (ctx: unknown, options: { isCached: boolean }): void {
        return notifyResponseEndedWithEmptyBody(ctx as ResponseInterceptionMiddlewareCtx, options)
      },
    },
  }
}
