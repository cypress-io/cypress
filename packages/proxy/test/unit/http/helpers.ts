import { HttpMiddleware, _runStage } from '../../../lib/http'

export function testMiddleware (middleware: HttpMiddleware<any>[], ctx = {}) {
  const fullCtx = {
    debug: () => {},
    req: {},
    res: {},
    config: {},
    getRemoteState: () => {},

    middleware: {
      0: middleware,
    },

    ...ctx,
  }

  return _runStage(0, fullCtx)
}
