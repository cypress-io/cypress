import { HttpMiddleware, HttpStages, _runStage } from '../../../lib/http'
import { NetworkInterceptionCore } from '@packages/network-interception'
import { ProxyCommandLogAdapter } from '../../../lib/adapters/proxy-command-log'
import { ProxyCookieStateAdapter } from '../../../lib/adapters/proxy-cookie-state'
import { ProxyDocumentPreparationAdapter } from '../../../lib/adapters/proxy-document-preparation'
import { ProxyNetworkCaptureAdapter } from '../../../lib/adapters/proxy-network-capture'
import { ProxyRequestInterceptionAdapter, ProxyResponseInterceptionAdapter } from '../../../lib/adapters'

export function createTestNetworkInterceptionCore () {
  return new NetworkInterceptionCore({
    requestInterception: new ProxyRequestInterceptionAdapter(),
    responseInterception: new ProxyResponseInterceptionAdapter(),
    documentPreparation: new ProxyDocumentPreparationAdapter(),
    networkCapture: new ProxyNetworkCaptureAdapter(),
    cookieState: new ProxyCookieStateAdapter(),
    commandLog: new ProxyCommandLogAdapter(),
  })
}

export function testMiddleware (middleware: HttpMiddleware<any>[], ctx = {}) {
  const fullCtx = {
    debug: () => {},
    req: {},
    res: {},
    config: {},
    networkInterceptionCore: createTestNetworkInterceptionCore(),

    middleware: {
      0: middleware,
    },

    ...ctx,
  }

  const onError = (error) => {
    throw error
  }

  return _runStage(HttpStages.IncomingRequest, fullCtx, onError).then(() => {
    Object.assign(ctx, fullCtx)
  })
}
