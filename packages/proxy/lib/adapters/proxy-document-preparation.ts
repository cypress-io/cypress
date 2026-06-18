import type { ForDocumentPreparation } from '@packages/network-interception'
import { setInjectionLevel } from './set-injection-level'
import { injectHtml } from './inject-html'
import { removeSecurity } from './remove-security'
import type { ResponseInterceptionMiddlewareCtx } from './types'

/** {@link ForDocumentPreparation} adapter — delegates to legacy proxy document-prep middleware. */
export class ProxyDocumentPreparationAdapter implements ForDocumentPreparation {
  setInjectionLevel (ctx: unknown): Promise<void> {
    return setInjectionLevel(ctx as ResponseInterceptionMiddlewareCtx)
  }

  injectHtml (ctx: unknown): Promise<void> {
    return injectHtml(ctx as ResponseInterceptionMiddlewareCtx)
  }

  removeSecurity (ctx: unknown): Promise<void> {
    return removeSecurity(ctx as ResponseInterceptionMiddlewareCtx)
  }
}
