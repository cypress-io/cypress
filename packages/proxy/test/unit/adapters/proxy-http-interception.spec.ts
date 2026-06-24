import { describe, it, expect, vi } from 'vitest'
import { PassThrough } from 'stream'
import { IncomingMessage } from 'http'
import { Socket } from 'net'
import {
  applyOutboundToProxiedRequest,
  ensureRequestBody,
  fetchOriginAsHttpResponse,
  toHttpRequest,
} from '../../../lib/adapters/proxy-http-interception'
import { applyHttpResponseToCtx } from '../../../lib/adapters/apply-http-response'
import { sendRequestOutgoing } from '../../../lib/adapters/send-request-outgoing'
import type { RequestInterceptionMiddlewareCtx } from '../../../lib/adapters/types'

describe('proxy-http-interception lazy passthrough', () => {
  describe('toHttpRequest', () => {
    it('does not include body until materializeRequestBody runs', async () => {
      const reqStream = new PassThrough()

      reqStream.end('hello')

      const mw = {
        req: {
          proxiedUrl: 'https://example.com/',
          method: 'POST',
          headers: { 'content-type': 'text/plain' },
          pipe: (dest: PassThrough) => reqStream.pipe(dest),
        },
        res: {
          destroyed: false,
          once: vi.fn(),
          off: vi.fn(),
        },
      } as unknown as RequestInterceptionMiddlewareCtx

      const httpRequest = toHttpRequest(mw)

      expect(httpRequest.body).toBeUndefined()

      await ensureRequestBody(mw)

      expect(mw.req.requestBodyMaterialized).toBe(true)
      expect(Buffer.isBuffer(mw.req.body) ? mw.req.body.toString() : mw.req.body).toBe('hello')
    })
  })

  describe('applyOutboundToProxiedRequest', () => {
    it('does not set body or requestBodyMaterialized when outbound body is unset', () => {
      const proxiedReq = {
        proxiedUrl: 'https://example.com/',
        method: 'GET',
        headers: {},
      } as any

      applyOutboundToProxiedRequest(proxiedReq, {
        inFlightInterceptId: 'id',
        url: 'https://example.com/',
        method: 'GET',
        headers: { foo: 'bar' },
      })

      expect(proxiedReq.body).toBeUndefined()
      expect(proxiedReq.requestBodyMaterialized).toBeUndefined()
    })

    it('sets requestBodyMaterialized when outbound body is set', () => {
      const proxiedReq = {
        proxiedUrl: 'https://example.com/',
        method: 'POST',
        headers: {},
      } as any

      applyOutboundToProxiedRequest(proxiedReq, {
        inFlightInterceptId: 'id',
        url: 'https://example.com/',
        method: 'POST',
        headers: {},
        body: 'payload',
        requestBodyMaterialized: true,
      })

      expect(proxiedReq.body).toBe('payload')
      expect(proxiedReq.requestBodyMaterialized).toBe(true)
    })

    it('sets requestBodyMaterialized without body for materialized empty requests', () => {
      const proxiedReq = {
        proxiedUrl: 'https://example.com/',
        method: 'POST',
        headers: {},
      } as any

      applyOutboundToProxiedRequest(proxiedReq, {
        inFlightInterceptId: 'id',
        url: 'https://example.com/',
        method: 'POST',
        headers: {},
        requestBodyMaterialized: true,
      })

      expect(proxiedReq.body).toBeUndefined()
      expect(proxiedReq.requestBodyMaterialized).toBe(true)
    })
  })

  describe('sendRequestOutgoing', () => {
    it('pipes when requestBodyMaterialized is false', () => {
      const pipe = vi.fn()

      const ctx = {
        onError: vi.fn(),
        onResponse: vi.fn(),
        debug: vi.fn(),
        request: {
          create: () => {
            return {
              on: vi.fn(),
            }
          },
        },
        req: {
          proxiedUrl: 'https://example.com/',
          headers: {},
          pipe,
          socket: { on: vi.fn() },
          res: { on: vi.fn() },
        },
        remoteStates: {
          current: () => ({ strategy: 'http', origin: 'https://example.com' }),
        },
        reqMiddlewareSpan: { end: vi.fn() },
        handleHttpRequestSpan: undefined,
      } as any

      sendRequestOutgoing(ctx)

      expect(pipe).toHaveBeenCalled()
    })

    it('does not pipe when requestBodyMaterialized is true with empty body', () => {
      const pipe = vi.fn()

      const ctx = {
        onError: vi.fn(),
        onResponse: vi.fn(),
        debug: vi.fn(),
        request: {
          create: (opts: any) => {
            expect(opts.body).toBe('')

            return { on: vi.fn() }
          },
        },
        req: {
          proxiedUrl: 'https://example.com/',
          method: 'POST',
          headers: {},
          body: '',
          requestBodyMaterialized: true,
          pipe,
          socket: { on: vi.fn() },
          res: { on: vi.fn() },
        },
        remoteStates: {
          current: () => ({ strategy: 'http', origin: 'https://example.com' }),
        },
        reqMiddlewareSpan: { end: vi.fn() },
        handleHttpRequestSpan: undefined,
      } as any

      sendRequestOutgoing(ctx)

      expect(pipe).not.toHaveBeenCalled()
    })
  })

  describe('fetchOriginAsHttpResponse', () => {
    it('returns lazy response with consumePassthroughResponse', async () => {
      const incomingRes = new IncomingMessage(new Socket)

      incomingRes.statusCode = 200
      incomingRes.headers = { 'content-type': 'text/plain' }

      const outgoingBody = PassThrough.from(['origin-body'])
      const outgoingReq = Object.assign(outgoingBody, {
        on (event: string, cb: (res: IncomingMessage) => void) {
          if (event === 'response') {
            cb(incomingRes)
          }
        },
      })

      const mw = {
        req: {
          proxiedUrl: 'https://example.com/',
          method: 'GET',
          headers: {},
          pipe: vi.fn(),
          socket: { on: vi.fn() },
          res: { on: vi.fn() },
        },
        onError: vi.fn(),
        onResponse: vi.fn(),
        request: {
          create: () => outgoingReq,
        },
        remoteStates: {
          current: () => ({ strategy: 'http', origin: 'https://example.com' }),
        },
        debug: vi.fn(),
        reqMiddlewareSpan: { end: vi.fn() },
        handleHttpRequestSpan: undefined,
      } as unknown as RequestInterceptionMiddlewareCtx

      const httpResponse = await fetchOriginAsHttpResponse(mw)

      expect(httpResponse.body).toBeUndefined()
      expect(httpResponse.consumePassthroughResponse).toBeTypeOf('function')

      const passthrough = httpResponse.consumePassthroughResponse!()

      expect(passthrough.incomingRes).toBe(incomingRes)
      expect(passthrough.stream).toBe(outgoingBody)
    })
  })
})

describe('applyHttpResponseToCtx passthrough', () => {
  it('calls onResponse with origin stream when body is unset', async () => {
    const stream = PassThrough.from(['streamed'])
    const incomingRes = new IncomingMessage(new Socket)

    incomingRes.statusCode = 200
    incomingRes.headers = { 'content-type': 'text/plain' }

    const onResponse = vi.fn()

    await applyHttpResponseToCtx({
      req: { hadIntercept: false },
      onResponse,
    } as any, {
      statusCode: 200,
      headers: { 'content-type': 'text/plain' },
      consumePassthroughResponse: () => ({ incomingRes, stream }),
    })

    expect(onResponse).toHaveBeenCalledWith(incomingRes, stream)
  })

  it('uses getBodyStream when body is set', async () => {
    const onResponse = vi.fn()

    await applyHttpResponseToCtx({
      req: { hadIntercept: true, headers: {} },
      onResponse,
    } as any, {
      statusCode: 200,
      headers: {},
      body: 'stubbed',
    })

    expect(onResponse).toHaveBeenCalled()
    const [, bodyStream] = onResponse.mock.calls[0]

    expect(bodyStream).toBeDefined()
  })
})
