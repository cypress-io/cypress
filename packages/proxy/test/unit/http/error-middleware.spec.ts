import { describe, expect, it, vi } from 'vitest'
import _ from 'lodash'
import ErrorMiddleware, {
  AbortRequest,
  UnpipeResponse,
  DestroyResponse,
} from '../../../lib/http/error-middleware'
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
})
