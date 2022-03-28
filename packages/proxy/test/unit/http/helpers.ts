import { HttpMiddleware, HttpStages, _runStage } from '../../../lib/http'

export function testMiddleware (middleware: HttpMiddleware<any>[], ctx = {}) {
  const fullCtx = {
    debug: () => {},
    req: {},
    res: {},
    config: {},

    middleware: {
      0: middleware,
    },

    ...ctx,
  }

  const onError = (error) => {
    throw error
  }

  return _runStage(HttpStages.IncomingRequest, fullCtx, onError)
}
