import { describe, it, expect, vi } from 'vitest'
import { PassThrough } from 'stream'
import { IncomingMessage } from 'http'
import { Socket } from 'net'
import {
  applyOutboundToProxiedRequest,
  createFetchOrigin,
  ensureRequestBody,
  toHttpRequest,
} from '../../../lib/adapters/proxy-http-interception'
import { HttpResponseCodec } from '../../../lib/adapters/http-response-codec'
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

  describe('createFetchOrigin', () => {
    function makeMw (outgoingReq: any) {
      return {
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
    }

    it('attaches stream() for passthrough without buffering', async () => {
      const incomingRes = new IncomingMessage(new Socket)

      incomingRes.statusCode = 200
      incomingRes.headers = { 'content-type': 'text/plain' }

      const outgoingBody = new PassThrough()
      const mw = makeMw(outgoingBody)

      // Emit 'response' after sendRequestOutgoing registers its listener
      setImmediate(() => outgoingBody.emit('response', incomingRes))

      const httpResponse = await createFetchOrigin(mw)(toHttpRequest(mw))

      expect(httpResponse.body).toBeUndefined()
      expect(typeof httpResponse.stream).toBe('function')
      expect(await httpResponse.stream!()).toBe(outgoingBody)
    })

    it('materializes body when materializeOriginResponse is set', async () => {
      const incomingRes = new IncomingMessage(new Socket)

      incomingRes.statusCode = 200
      incomingRes.headers = { 'content-type': 'text/plain' }

      const outgoingBody = new PassThrough()

      outgoingBody.end('origin-body')
      const mw = makeMw(outgoingBody)

      setImmediate(() => outgoingBody.emit('response', incomingRes))

      const httpResponse = await createFetchOrigin(mw)({
        inFlightInterceptId: 'id',
        url: 'https://example.com/',
        method: 'GET',
        headers: {},
        materializeOriginResponse: true,
      })

      expect(httpResponse.body).toBe('origin-body')
      expect(typeof httpResponse.stream).toBe('function')
    })

    it('restores onError and onResponse after origin failure', async () => {
      const originalOnError = vi.fn()
      const originalOnResponse = vi.fn()
      const originError = new Error('connection refused')

      const outgoingReq = {
        on (event: string, cb: (error: Error) => void) {
          if (event === 'error') {
            cb(originError)
          }
        },
      }

      const mw = {
        req: {
          proxiedUrl: 'https://example.com/',
          method: 'GET',
          headers: {},
          pipe: vi.fn(),
          socket: { on: vi.fn() },
          res: { on: vi.fn() },
        },
        onError: originalOnError,
        onResponse: originalOnResponse,
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

      await expect(createFetchOrigin(mw)(toHttpRequest(mw))).rejects.toThrow('connection refused')
      expect(mw.onError).toBe(originalOnError)
      expect(mw.onResponse).toBe(originalOnResponse)
    })
  })
})

describe('HttpResponseCodec', () => {
  it('decodes passthrough responses via stream()', async () => {
    const originStream = new PassThrough()

    const { incomingRes, bodyStream } = await HttpResponseCodec.toProxyResponse({
      statusCode: 200,
      headers: { 'content-type': 'text/plain' },
      stream: () => Promise.resolve(originStream),
    })

    expect(incomingRes.statusCode).toBe(200)
    expect(incomingRes.headers['content-type']).toBe('text/plain')
    expect(bodyStream).toBe(originStream)
  })

  it('decodes stub bodies', async () => {
    const { incomingRes, bodyStream } = await HttpResponseCodec.toProxyResponse({
      statusCode: 200,
      headers: {},
      body: 'stubbed',
    })

    expect(incomingRes.statusCode).toBe(200)
    expect(bodyStream).toBeDefined()
  })

  it('infers text/html for HTML stub bodies without content-type', async () => {
    const { incomingRes } = await HttpResponseCodec.toProxyResponse({
      statusCode: 200,
      headers: {},
      body: '<html><body>hi</body></html>',
    })

    expect(incomingRes.headers['content-type']).toBe('text/html')
  })

  it('merges intercept status and headers onto a synthetic IncomingMessage', async () => {
    const originStream = new PassThrough()

    const { incomingRes } = await HttpResponseCodec.toProxyResponse({
      statusCode: 418,
      headers: { 'content-type': 'text/plain', 'x-test': 'changed' },
      stream: () => Promise.resolve(originStream),
    })

    expect(incomingRes.statusCode).toBe(418)
    expect(incomingRes.headers['x-test']).toBe('changed')
    expect(incomingRes.headers['content-type']).toBe('text/plain')
  })
})
