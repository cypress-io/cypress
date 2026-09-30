import { describe, it, expect, vi } from 'vitest'
import { Readable } from 'stream'
import { handleInterceptResponse } from '../../lib/server/handle-intercept-response'

type ResChanges = (res: any) => void

function createMiddlewareCtx (applyChanges: ResChanges) {
  const incomingRes = {
    statusCode: 200,
    statusMessage: 'OK',
    headers: { 'content-type': 'application/json' },
  }

  const request = {
    res: {},
    handleSubscriptions: vi.fn(async ({ data, mergeChanges }) => {
      const changed = JSON.parse(JSON.stringify(data))

      applyChanges(changed)
      mergeChanges(data, changed)

      return data
    }),
  }

  const next = vi.fn()

  const mw = {
    req: { requestId: 'req1', method: 'GET', proxiedUrl: 'http://localhost:3001/api/users/1' },
    incomingRes,
    incomingResStream: Readable.from([Buffer.from('{"isAdmin":false}')]),
    netStubbingState: { requests: { req1: request } },
    makeResStreamPlainText: vi.fn(),
    onError: vi.fn(),
    next,
  }

  return { mw, incomingRes, next }
}

describe('handleInterceptResponse', () => {
  it('applies a statusCode assigned in a response handler to the response sent to the client', async () => {
    const { mw, incomingRes, next } = createMiddlewareCtx((res) => {
      res.statusCode = 503
    })

    await handleInterceptResponse(mw as any)

    expect(next).toHaveBeenCalledOnce()
    expect(incomingRes.statusCode).toEqual(503)
    // the origin's "OK" does not describe a 503, so the default phrase applies
    expect(incomingRes.statusMessage).toEqual('')
  })

  it('applies a statusMessage assigned in a response handler to the response sent to the client', async () => {
    const { mw, incomingRes } = createMiddlewareCtx((res) => {
      res.statusCode = 503
      res.statusMessage = 'Down For Maintenance'
    })

    await handleInterceptResponse(mw as any)

    expect(incomingRes.statusCode).toEqual(503)
    expect(incomingRes.statusMessage).toEqual('Down For Maintenance')
  })

  it.each([1000, 42, 200.5, '5xx'])('keeps the origin status when a response handler sets statusCode to %o', async (statusCode) => {
    const { mw, incomingRes, next } = createMiddlewareCtx((res) => {
      res.statusCode = statusCode
    })

    await handleInterceptResponse(mw as any)

    expect(next).toHaveBeenCalledOnce()
    expect(incomingRes.statusCode).toEqual(200)
    expect(incomingRes.statusMessage).toEqual('OK')
  })

  it('keeps the origin status when a response handler sets a statusMessage containing a line break', async () => {
    const { mw, incomingRes } = createMiddlewareCtx((res) => {
      res.statusCode = 503
      res.statusMessage = 'Bad\r\nInjected: header'
    })

    await handleInterceptResponse(mw as any)

    expect(incomingRes.statusCode).toEqual(200)
    expect(incomingRes.statusMessage).toEqual('OK')
  })

  it('keeps the origin status and reason phrase when a response handler does not change them', async () => {
    const { mw, incomingRes } = createMiddlewareCtx((res) => {
      res.headers['x-foo'] = 'bar'
    })

    await handleInterceptResponse(mw as any)

    expect(incomingRes.statusCode).toEqual(200)
    expect(incomingRes.statusMessage).toEqual('OK')
    expect(incomingRes.headers['x-foo']).toEqual('bar')
  })
})
