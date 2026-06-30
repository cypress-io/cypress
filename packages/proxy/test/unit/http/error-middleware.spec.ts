import { describe, expect, it, vi } from 'vitest'
import _ from 'lodash'
import ErrorMiddleware, {
  AbortRequest,
  UnpipeResponse,
  DestroyResponse,
} from '../../../lib/http/error-middleware'
import { InterceptError } from '@packages/net-stubbing/lib/server/middleware/error'
import {
  testMiddleware,
} from './helpers'

describe('http/error-middleware', function () {
  it('exports the members in the correct order', function () {
    expect(_.keys(ErrorMiddleware)).toEqual([
      'LogError',
      'SendToDriver',
      'InterceptError',
      'AbortRequest',
      'UnpipeResponse',
      'DestroyResponse',
    ])
  })

  describe('AbortRequest', function () {
    it('destroys outgoingReq if it exists', async function () {
      const ctx = {
        outgoingReq: {
          abort: vi.fn(),
        },
        res: {
          on: (event, listener) => {},
          off: (event, listener) => {},
        },
      }

      await testMiddleware([AbortRequest], ctx)
      expect(ctx.outgoingReq.abort).toHaveBeenCalledOnce()
    })

    it('does not destroy outgoingReq if it does not exist', async function () {
      await testMiddleware([AbortRequest], {
        res: {
          on: (event, listener) => {},
          off: (event, listener) => {},
        },
      })
    })
  })

  describe('UnpipeResponse', function () {
    it('unpipes incomingRes if it exists', async function () {
      const ctx = {
        incomingResStream: {
          unpipe: vi.fn(),
        },
        res: {
          on: (event, listener) => {},
          off: (event, listener) => {},
        },
      }

      await testMiddleware([UnpipeResponse], ctx)
      expect(ctx.incomingResStream.unpipe).toHaveBeenCalledOnce()
    })

    it('does not unpipe incomingRes if it does not exist', async function () {
      await testMiddleware([UnpipeResponse], {
        res: {
          on: (event, listener) => {},
          off: (event, listener) => {},
        },
      })
    })
  })

  describe('DestroyResponse', function () {
    it('destroys the response', async function () {
      const ctx = {
        res: {
          destroy: vi.fn(),
          on: (event, listener) => {},
          off: (event, listener) => {},
        },
      }

      await testMiddleware([DestroyResponse], ctx)
      expect(ctx.res.destroy).toHaveBeenCalledOnce()
    })
  })

  describe('InterceptError', function () {
    it('delegates intercepted request errors to onInterceptNetworkError', async function () {
      const onInterceptNetworkError = vi.fn(async () => {})
      const error = new Error('proxy failed')

      await testMiddleware([InterceptError], {
        req: {
          hadIntercept: true,
          requestId: 'intercept-1',
        },
        error,
        onInterceptNetworkError,
        res: {
          on: (event, listener) => {},
          off: (event, listener) => {},
        },
      })

      expect(onInterceptNetworkError).toHaveBeenCalledOnce()
      expect(onInterceptNetworkError).toHaveBeenCalledWith('intercept-1', error)
    })

    it('skips onInterceptNetworkError when the request was not intercepted', async function () {
      const onInterceptNetworkError = vi.fn(async () => {})

      await testMiddleware([InterceptError], {
        req: {
          hadIntercept: false,
          requestId: 'intercept-1',
        },
        error: new Error('proxy failed'),
        onInterceptNetworkError,
        res: {
          on: (event, listener) => {},
          off: (event, listener) => {},
        },
      })

      expect(onInterceptNetworkError).not.toHaveBeenCalled()
    })
  })
})
