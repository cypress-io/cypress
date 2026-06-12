import { HttpMiddleware, HttpStages, _runStage } from '../../../lib/http'
import { NetworkInterceptionCore } from '@packages/network-interception'
import { ProxyDocumentPreparationAdapter } from '../../../lib/adapters/proxy-document-preparation'
import {
  ProxyCommandLogAdapter,
  ProxyCookieStateAdapter,
  ProxyNetworkCaptureAdapter,
  ProxyRequestInterceptionAdapter,
  ProxyResponseInterceptionAdapter,
} from '../../../lib/adapters'

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

export function testMiddleware (middleware: HttpMiddleware<any>[], ctx = {}, onErrorHandler?: (error: Error) => void) {
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

  const onError = onErrorHandler ?? ((error) => {
    throw error
  })

  return _runStage(HttpStages.IncomingRequest, fullCtx, onError).then(() => {
    Object.assign(ctx, fullCtx)
  })
}
