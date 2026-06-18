import { HttpMiddleware, HttpStages, _runStage } from '../../../lib/http'
import { createProxyNetworkServices } from '../../../lib/adapters/create-proxy-network-services'
import { createMockNetworkInterception } from '../../support/mock-network-interception'

export function createTestNetworkServices () {
  return createProxyNetworkServices()
}

export function testMiddleware (middleware: HttpMiddleware<any>[], ctx = {}, onError?: (error: unknown) => void) {
  const fullCtx = {
    debug: () => {},
    req: {},
    res: {},
    config: {},
    networkServices: createTestNetworkServices(),
    networkInterception: createMockNetworkInterception(),
    netStubbingState: { routes: [] },

    middleware: {
      0: middleware,
    },

    ...ctx,
  }

  const handleError = onError ?? ((error) => {
    throw error
  })

  return _runStage(HttpStages.IncomingRequest, fullCtx, handleError).then(() => {
    Object.assign(ctx, fullCtx)
  })
}
