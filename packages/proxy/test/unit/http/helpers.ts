import { HttpMiddleware, HttpStages, _runStage } from '../../../lib/http'
import { NetworkPolicyCore } from '@packages/network-policy'
import {
  ProxyCommandLogAdapter,
  ProxyCookieStateAdapter,
  ProxyDocumentPreparationAdapter,
  ProxyNetworkCaptureAdapter,
  ProxyRequestInterceptionAdapter,
  ProxyResponseInterceptionAdapter,
} from '../../../lib/adapters'

export function createTestNetworkPolicyCore () {
  return new NetworkPolicyCore({
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
    networkPolicyCore: createTestNetworkPolicyCore(),

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
