import { HttpMiddleware, HttpStages, _runStage } from '../../../lib/http'
import { NetworkPolicyRegistry } from '@packages/network-interception'
import { createDefaultNetworkInterceptionCore } from '../../../lib/adapters/create-default-network-interception-core'

export function createTestNetworkInterceptionCore () {
  return createDefaultNetworkInterceptionCore({
    policyRegistration: new NetworkPolicyRegistry(),
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
