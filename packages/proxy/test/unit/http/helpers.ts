import { HttpMiddleware, HttpStages, _runStage } from '../../../lib/http'
import { NetworkInterceptionCore } from '@packages/network-interception'
import { ProxyRequestInterceptionAdapter, ProxyResponseInterceptionAdapter } from '../../../lib/adapters'

export function createTestNetworkInterceptionCore () {
  return new NetworkInterceptionCore({
    requestInterception: new ProxyRequestInterceptionAdapter(),
    responseInterception: new ProxyResponseInterceptionAdapter(),
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
