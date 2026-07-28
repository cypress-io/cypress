import { HttpMiddleware, HttpStages, _runStage } from '../../../lib/http'
import { NetworkPolicyRegistry } from '@packages/network-interception'
import { createProxyNetworkInterception } from '../../../lib/adapters/create-proxy-network-interception'
import { ProxyContentEncodingAdapter } from '../../../lib/adapters/content-encoding'

export function createTestNetworkInterceptionCore () {
  return createProxyNetworkInterception({
    policyRegistration: new NetworkPolicyRegistry(),
  })
}

type TestMiddlewareStack = HttpMiddleware<any>[] | Record<string, HttpMiddleware<any>>

export function testMiddleware (middleware: TestMiddlewareStack, ctx: Record<string, any> = {}, onErrorHandler?: (error: Error) => void) {
  const { onlyRunMiddleware: _onlyRunMiddleware, onError: ctxOnError, ...ctxRest } = ctx

  const fullCtx = {
    debug: () => {},
    req: {},
    res: {},
    config: {},
    networkInterceptionCore: createTestNetworkInterceptionCore(),
    // mirrors createMiddlewareContext: Node-performs-the-transfer by default
    contentEncoding: new ProxyContentEncodingAdapter(),

    middleware: {
      0: middleware,
    },

    ...ctxRest,
  }

  const onError = onErrorHandler ?? ctxOnError ?? ((error) => {
    throw error
  })

  return _runStage(HttpStages.IncomingRequest, fullCtx, onError).then(() => {
    Object.assign(ctx, fullCtx)
  })
}
