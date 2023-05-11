import Debug from 'debug'
import _ from 'lodash'
import * as errors from '@packages/server/lib/errors'

import type { ErrorMiddleware } from '@packages/proxy'
import type { CyHttpMessages } from '../../types'
const debug = Debug('cypress:net-stubbing:server:intercept-error')

export const InterceptError: ErrorMiddleware = async (ctx) => {
  const request = ctx.netStubbingState.requests[ctx.req.requestId]

  if (!request) {
    // the original request was not intercepted, nothing to do
    return ctx.next()
  }

  debug('intercepting error %o', { req: ctx.req, request })

  request.continueResponse = ctx.next

  await request.handleSubscriptions<CyHttpMessages.NetworkError>({
    eventName: 'network:error',
    data: {
      error: errors.cloneErr(ctx.error),
    },
    mergeChanges: _.noop,
  })

  ctx.next()
}
