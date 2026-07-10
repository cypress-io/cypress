import { HttpMiddleware, HttpStages, _runStage } from '../../../lib/http'
import { NetworkPolicyRegistry } from '@packages/network-interception'
import { createProxyNetworkInterception } from '../../../lib/adapters/create-proxy-network-interception'

export function createTestNetworkInterceptionCore () {
  return createProxyNetworkInterception({
    policyRegistration: new NetworkPolicyRegistry(),
  })
}

export function testMiddleware (middleware: HttpMiddleware<any>[], ctx = {}, onErrorHandler?: (error: Error) => void) {
  const onlyRunMiddlewareCalls: string[][] = []

  const fullCtx = {
    debug: () => {},
    req: {},
    res: {},
    config: {},
    networkInterceptionCore: ctx.networkInterceptionCore ?? createTestNetworkInterceptionCore(),
    __trackOnlyRunMiddleware: (names: string[]) => {
      onlyRunMiddlewareCalls.push(names)
    },
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
    ctx.onlyRunMiddlewareCalls = onlyRunMiddlewareCalls
  })
}
