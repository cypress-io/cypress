const { expect, sinon } = require('../../spec_helper')

import { Readable } from 'stream'
import type { Protocol } from 'devtools-protocol'
import { HttpIntercept } from '@packages/network-interception'
import { digestBody } from '../../../lib/browsers/cdp-protocol/body-digest'
import { createCdpFetchCodec } from '../../../lib/browsers/cdp-protocol/cdp-fetch-codec'
import { CdpFetchTransport } from '../../../lib/browsers/cdp-protocol/cdp-fetch-transport'
import type { CdpFetchTransportRequest } from '../../../lib/browsers/cdp-protocol/cdp-fetch-transport'
import { CdpBodyCapture } from '../../../lib/browsers/cdp-protocol/cdp-body-capture'
import { toNetworkError } from '../../../lib/browsers/cdp-protocol/cdp-network-error'
import { shouldStreamResponseBody } from '../../../lib/browsers/cdp-protocol/should-stream-response-body'

function createPausedRequest (options: {
  requestId: string
  networkId?: string
  url?: string
  resourceType?: Protocol.Network.ResourceType
  responseStatusCode?: number
  responseStatusText?: string
  responseErrorReason?: Protocol.Network.ErrorReason
}): Protocol.Fetch.RequestPausedEvent {
  return {
    requestId: options.requestId,
    networkId: options.networkId,
    frameId: 'frame-1',
    resourceType: options.resourceType ?? 'Document',
    request: {
      url: options.url ?? 'https://example.test/',
      method: 'GET',
      headers: {},
    },
    responseStatusCode: options.responseStatusCode,
    responseStatusText: options.responseStatusText,
    responseErrorReason: options.responseErrorReason,
  } as Protocol.Fetch.RequestPausedEvent
}

function createClient () {
  const send = sinon.stub().resolves({})

  // resolveResponse eagerly fetches the body for every response pause;
  // give it a decodable default so tests that don't care about body content
  // don't have to stub it themselves
  send.withArgs('Fetch.getResponseBody').resolves({ body: '', base64Encoded: false })

  return {
    send,
    on: sinon.stub(),
    off: sinon.stub(),
  }
}

// CDPNetworkExtraInfo (the Network.* extraInfo correlation) has its own spec;
// the transport is tested against a stub of its interface.
function createNetworkExtraInfo () {
  return {
    start: sinon.stub(),
    stop: sinon.stub(),
    flush: sinon.stub(),
    clear: sinon.stub(),
    responseExtraInfo: sinon.stub().resolves(undefined),
  }
}

function createTransport (client: ReturnType<typeof createClient>, options: {
  httpIntercept?: HttpIntercept<any, any>
  isAUTFrame?: (frameId: string) => Promise<boolean>
  isFromExtraTarget?: boolean
  addPendingUrlWithoutPreRequest?: (url: string) => void
  onRequestCanceled?: (requestId: string) => void
  shouldStreamBody?: (event: Protocol.Fetch.RequestPausedEvent, context: { hasMatchingRoute: boolean }) => boolean
  shouldCaptureBody?: () => boolean
  bodyCapture?: CdpBodyCapture
} = {}) {
  const networkExtraInfo = createNetworkExtraInfo()
  const bodyCapture = options.bodyCapture ?? new CdpBodyCapture(client as any)
  // JS rewriting is assumed on and the route match is threaded straight
  // through from the pause's own hadMatchingRoutes (nothing in this fake
  // pipeline sets it unless a test's middleware does, so it defaults to
  // false) — mirrors network-runtime's real composition instead of the
  // retired always-true stand-in.
  const defaultShouldStreamBody = (event: Protocol.Fetch.RequestPausedEvent, { hasMatchingRoute }: { hasMatchingRoute: boolean }): boolean => {
    return shouldStreamResponseBody(event, { modifyObstructiveCode: true, hasMatchingRoute: () => hasMatchingRoute })
  }
  const transport = new CdpFetchTransport(client as any, options.httpIntercept, {
    isAUTFrame: options.isAUTFrame,
    isFromExtraTarget: options.isFromExtraTarget,
    addPendingUrlWithoutPreRequest: options.addPendingUrlWithoutPreRequest,
    onRequestCanceled: options.onRequestCanceled,
    shouldStreamBody: options.shouldStreamBody ?? defaultShouldStreamBody,
    shouldCaptureBody: options.shouldCaptureBody,
  }, networkExtraInfo as any, bodyCapture)

  return { transport, networkExtraInfo, bodyCapture }
}

function onLoadingFailed (client: ReturnType<typeof createClient>, event: {
  requestId: string
  canceled?: boolean
  errorText?: string
}, sessionId?: string) {
  client.on.withArgs('Network.loadingFailed').getCalls().forEach((call) => {
    call.args[1]({
      canceled: false,
      errorText: 'net::ERR_ABORTED',
      type: 'Fetch',
      ...event,
    } as Protocol.Network.LoadingFailedEvent, sessionId)
  })
}

async function startTransport (transport: CdpFetchTransport, client: ReturnType<typeof createClient>) {
  await transport.start()
  client.send.resetHistory()

  return (event: Protocol.Fetch.RequestPausedEvent, sessionId?: string) => {
    return Promise.all(client.on.withArgs('Fetch.requestPaused').getCalls().map((call) => {
      const handler = call.args[1] as (event: Protocol.Fetch.RequestPausedEvent, sessionId?: string) => void

      return handler(event, sessionId)
    }))
  }
}

async function tick () {
  await Promise.resolve()
}

async function readStream (stream: NodeJS.ReadableStream): Promise<string> {
  const chunks: Buffer[] = []

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }

  return Buffer.concat(chunks).toString()
}

// Drives the paired request-stage/response-stage Fetch.requestPaused pauses
// shared by the stream-classification and capture-arming tests below.
async function driveResponsePause (
  onRequestPaused: (event: Protocol.Fetch.RequestPausedEvent, sessionId?: string) => Promise<unknown>,
  requestOptions: Parameters<typeof createPausedRequest>[0],
  response: { statusCode?: number, headers?: Protocol.Fetch.HeaderEntry[] } = {},
  sessionId?: string,
) {
  const handled = onRequestPaused(createPausedRequest(requestOptions), sessionId)

  await tick()

  const responseEvent = createPausedRequest({ ...requestOptions, responseStatusCode: response.statusCode ?? 200 })

  if (response.headers) {
    responseEvent.responseHeaders = response.headers
  }

  await onRequestPaused(responseEvent, sessionId)
  await handled

  return responseEvent
}

// Captures the response HttpIntercept.handle hands back, for tests that need
// to inspect the outbound response object (e.g. its captureStream) rather
// than just the resulting CDP calls.
function captureRawResponseIntercept () {
  let response: any

  return {
    httpIntercept: {
      handle: async (req: any, next: (outbound: any) => Promise<any>) => {
        response = await next(req)

        return response
      },
    } as any,
    getResponse: () => response,
  }
}

describe('CdpFetchTransport', () => {
  describe('toNetworkError', () => {
    it('reports a refused connection the way Node does', () => {
      const err = toNetworkError('http://127.0.0.1:3333/should-err?_=1', 'ConnectionRefused') as Error & { code: string }

      expect(err.message).to.equal('connect ECONNREFUSED 127.0.0.1:3333')
      expect(err.code).to.equal('ECONNREFUSED')
    })

    it('infers the default port from the scheme when the URL omits it', () => {
      expect(toNetworkError('https://example.test/thing', 'ConnectionRefused').message)
      .to.equal('connect ECONNREFUSED example.test:443')

      expect(toNetworkError('http://example.test/thing', 'ConnectionRefused').message)
      .to.equal('connect ECONNREFUSED example.test:80')
    })

    it('unbrackets an IPv6 literal, matching Node', () => {
      expect(toNetworkError('http://[::1]:3333/x', 'ConnectionRefused').message)
      .to.equal('connect ECONNREFUSED ::1:3333')
    })

    it('carries a timeout code the driver classifies as a responseTimeout failure', () => {
      const err = toNetworkError('http://example.test:8080/x', 'TimedOut') as Error & { code: string }

      expect(err.message).to.equal('connect ETIMEDOUT example.test:8080')
      expect(err.code).to.equal('ETIMEDOUT')
    })

    it('reports a DNS failure against the host alone', () => {
      const err = toNetworkError('http://nope.invalid/x', 'NameNotResolved') as Error & { code: string }

      expect(err.message).to.equal('getaddrinfo ENOTFOUND nope.invalid')
      expect(err.code).to.equal('ENOTFOUND')
    })

    it('omits the address for reasons Node reports without one', () => {
      const err = toNetworkError('http://example.test/x', 'ConnectionReset') as Error & { code: string }

      expect(err.message).to.equal('read ECONNRESET')
      expect(err.code).to.equal('ECONNRESET')
    })

    // Inventing a Node code for these would misreport what the browser saw.
    it('falls back to naming the CDP reason when there is no Node equivalent', () => {
      const err = toNetworkError('http://example.test/x', 'BlockedByClient') as Error & { code?: string }

      expect(err.message).to.equal('CDP Fetch response failed for http://example.test/x: BlockedByClient')
      expect(err.code).to.be.undefined
    })

    it('still produces a coded error when the URL cannot be parsed', () => {
      const err = toNetworkError('not a url', 'ConnectionRefused') as Error & { code: string }

      expect(err.message).to.equal('connect ECONNREFUSED')
      expect(err.code).to.equal('ECONNREFUSED')
    })
  })

  describe('createCdpFetchCodec', () => {
    it('decodes CDP request pauses to the neutral request shape', () => {
      const codec = createCdpFetchCodec()
      const transportRequest = {
        id: 'network-1',
        url: 'https://example.test/',
        method: 'GET',
        headers: {},
      }

      const request = codec.decodeRequest(transportRequest)

      expect(request).to.deep.equal({
        body: undefined,
        headers: {},
        id: 'network-1',
        method: 'GET',
        url: 'https://example.test/',
        resourceType: undefined,
      })
    })

    it('copies transport resourceType onto the neutral request', () => {
      const codec = createCdpFetchCodec()
      const transportRequest = {
        id: 'network-1',
        url: 'https://example.test/',
        method: 'GET',
        headers: {},
        resourceType: 'xhr' as const,
      }

      expect(codec.decodeRequest(transportRequest).resourceType).to.equal('xhr')
    })

    it('encodes neutral request URL mutations onto the CDP transport context', () => {
      const codec = createCdpFetchCodec()
      const transportRequest = {
        id: 'network-1',
        url: 'https://example.test/',
        method: 'GET',
        headers: {},
      }

      const request = codec.decodeRequest(transportRequest)

      codec.encodeRequest({
        ...request,
        url: 'https://example.test/mutated',
      })

      expect(transportRequest.url).to.equal('https://example.test/mutated')
    })

    it('encodes neutral request header, method, and body mutations onto the CDP transport context', () => {
      const codec = createCdpFetchCodec()
      const transportRequest = {
        id: 'network-1',
        url: 'https://example.test/',
        method: 'GET',
        headers: {
          accept: '*/*',
        },
      }

      const request = codec.decodeRequest(transportRequest)

      codec.encodeRequest({
        ...request,
        method: 'POST',
        headers: {
          accept: '*/*',
          'accept-encoding': 'gzip, deflate',
          authorization: 'Basic abc123',
          cookie: 'a=1; b=2',
        },
        body: 'name=value',
      })

      expect(transportRequest).to.deep.include({
        method: 'POST',
        postData: 'name=value',
        headers: {
          accept: '*/*',
          'accept-encoding': 'gzip, deflate',
          authorization: 'Basic abc123',
          cookie: 'a=1; b=2',
        },
      })
    })

    // The net-stubbing pipeline hands every request back with a string body, so
    // a bodyless GET returns as ''. Forwarding that as postData would make
    // Chrome attach `Content-Length: 0` to a request that never had a body.
    it('does not encode an empty body onto a request the browser paused without one', () => {
      const codec = createCdpFetchCodec()
      const transportRequest = {
        id: 'network-1',
        url: 'https://example.test/',
        method: 'GET',
        headers: {},
      }

      const request = codec.decodeRequest(transportRequest)

      codec.encodeRequest({
        ...request,
        headers: { foo: 'bar' },
        body: '',
      })

      expect(transportRequest).not.to.have.property('postData')
    })

    it('encodes an emptied body when the pause carried one, so the change reaches the origin', () => {
      const codec = createCdpFetchCodec()
      const transportRequest = {
        id: 'network-1',
        url: 'https://example.test/',
        method: 'POST',
        headers: {},
        postData: 'original',
      }

      const request = codec.decodeRequest(transportRequest)

      codec.encodeRequest({
        ...request,
        body: '',
      })

      expect(transportRequest.postData).to.equal('')
    })

    it('encodes a non-empty body onto a request the browser paused without one', () => {
      const codec = createCdpFetchCodec()
      const transportRequest = {
        id: 'network-1',
        url: 'https://example.test/',
        method: 'GET',
        headers: {},
      }

      const request = codec.decodeRequest(transportRequest)

      codec.encodeRequest({
        ...request,
        body: 'added',
      })

      expect(transportRequest).to.have.property('postData', 'added')
    })

    it('decodes the body from postDataEntries so binary payloads keep their bytes', () => {
      const codec = createCdpFetchCodec()
      const body = Buffer.from([0x80, 0x81, 0x82, 0x83])
      const transportRequest: CdpFetchTransportRequest = {
        id: 'network-1',
        url: 'https://example.test/',
        method: 'POST',
        headers: {},
        postData: body.toString('utf8'),
        postDataEntries: [{ bytes: body.toString('base64') }],
      }

      expect(codec.decodeRequest(transportRequest).body).to.deep.equal(body)
    })

    it('concatenates every postDataEntries entry, as a multipart body arrives split', () => {
      const codec = createCdpFetchCodec()
      const parts = [Buffer.from('--boundary\r\n'), Buffer.from([0x80, 0x81]), Buffer.from('\r\n--boundary--')]
      const transportRequest: CdpFetchTransportRequest = {
        id: 'network-1',
        url: 'https://example.test/',
        method: 'POST',
        headers: {},
        postDataEntries: parts.map((part) => ({ bytes: part.toString('base64') })),
      }

      expect(codec.decodeRequest(transportRequest).body).to.deep.equal(Buffer.concat(parts))
    })

    it('falls back to postData when the pause carries no entries', () => {
      const codec = createCdpFetchCodec()
      const transportRequest: CdpFetchTransportRequest = {
        id: 'network-1',
        url: 'https://example.test/',
        method: 'POST',
        headers: {},
        postData: 'name=value',
      }

      expect(codec.decodeRequest(transportRequest).body).to.equal('name=value')
    })

    // Chrome describes a body it never materialized (a ReadableStream upload)
    // with entries that carry no bytes. Concatenating those would forge an empty
    // body and upload nothing in place of the real one.
    it('does not decode a body from entries the browser left without bytes', () => {
      const codec = createCdpFetchCodec()
      const transportRequest: CdpFetchTransportRequest = {
        id: 'network-1',
        url: 'https://example.test/',
        method: 'POST',
        headers: {},
        hasPostData: true,
        postDataEntries: [{}],
      }

      expect(codec.decodeRequest(transportRequest).body).to.be.undefined
    })

    it('does not re-encode a body the pipeline handed back untouched', () => {
      const codec = createCdpFetchCodec()
      const body = Buffer.from([0x80, 0x81, 0x82, 0x83])
      const transportRequest: CdpFetchTransportRequest = {
        id: 'network-1',
        url: 'https://example.test/',
        method: 'POST',
        headers: {},
        postData: body.toString('utf8'),
        postDataEntries: [{ bytes: body.toString('base64') }],
      }

      const request = codec.decodeRequest(transportRequest)

      codec.encodeRequest({ ...request, headers: { foo: 'bar' } })

      expect(transportRequest).not.to.have.property('postDataBuffer')
      expect(transportRequest.postData).to.equal(body.toString('utf8'))
    })

    // net-stubbing hands a body back as a string whenever the content-type
    // claims utf8, even for bytes that are not. Re-encoding that string would
    // upload replacement characters in place of the body the browser holds.
    it('does not re-encode a binary body the pipeline stringified but left untouched', () => {
      const codec = createCdpFetchCodec()
      const body = Buffer.from([0x80, 0x81, 0x82, 0x83])
      const transportRequest: CdpFetchTransportRequest = {
        id: 'network-1',
        url: 'https://example.test/',
        method: 'POST',
        headers: { 'content-type': 'application/json; charset=utf-8' },
        postData: 'chrome-lossy-view',
        postDataEntries: [{ bytes: body.toString('base64') }],
      }

      const request = codec.decodeRequest(transportRequest)

      // what handle-intercept-request does for a body it classifies as utf8
      codec.encodeRequest({ ...request, body: (request.body as Buffer).toString('utf8') })

      expect(transportRequest).not.to.have.property('postDataBuffer')
      expect(transportRequest.postData).to.equal('chrome-lossy-view')
    })

    it('encodes an edited binary body as bytes', () => {
      const codec = createCdpFetchCodec()
      const body = Buffer.from([0x80, 0x81, 0x82, 0x83])
      const edited = Buffer.from([0x84, 0x85, 0x86, 0x87])
      const transportRequest: CdpFetchTransportRequest = {
        id: 'network-1',
        url: 'https://example.test/',
        method: 'POST',
        headers: {},
        postData: body.toString('utf8'),
        postDataEntries: [{ bytes: body.toString('base64') }],
      }

      const request = codec.decodeRequest(transportRequest)

      codec.encodeRequest({ ...request, body: edited })

      expect(transportRequest.postDataBuffer).to.deep.equal(edited)
    })

    it('encodes an emptied body when only the entries recorded the pause body', () => {
      const codec = createCdpFetchCodec()
      const body = Buffer.from([0x80, 0x81, 0x82, 0x83])
      const transportRequest: CdpFetchTransportRequest = {
        id: 'network-1',
        url: 'https://example.test/',
        method: 'POST',
        headers: {},
        hasPostData: true,
        postDataEntries: [{ bytes: body.toString('base64') }],
      }

      const request = codec.decodeRequest(transportRequest)

      codec.encodeRequest({ ...request, body: '' })

      expect(transportRequest.postData).to.equal('')
    })

    it('encodes a binary body a handler emptied', () => {
      const codec = createCdpFetchCodec()
      const body = Buffer.from([0x80, 0x81, 0x82, 0x83])
      const transportRequest: CdpFetchTransportRequest = {
        id: 'network-1',
        url: 'https://example.test/',
        method: 'POST',
        headers: {},
        postData: body.toString('utf8'),
        postDataEntries: [{ bytes: body.toString('base64') }],
      }

      const request = codec.decodeRequest(transportRequest)

      codec.encodeRequest({ ...request, body: Buffer.alloc(0) })

      expect(transportRequest.postDataBuffer).to.deep.equal(Buffer.alloc(0))
      expect(transportRequest.postData).to.equal('')
    })

    it('round trips CDP response pauses through the neutral response shape', () => {
      const codec = createCdpFetchCodec()
      const transportRequest = {
        id: 'network-1',
        url: 'https://example.test/',
        method: 'GET',
        headers: {},
      }
      const transportResponse = {
        id: 'network-1',
        url: 'https://example.test/',
        method: 'GET',
        headers: {},
        requestId: 'fetch-request',
        responseCode: 200,
        responseStatusText: 'OK',
        responseHeaders: [{
          name: 'content-type',
          value: 'text/plain',
        }],
      }

      codec.decodeRequest(transportRequest)

      const response = codec.decodeResponse(transportResponse)

      expect(response).to.deep.equal({
        bodyStream: undefined,
        headers: {
          'content-type': 'text/plain',
        },
        id: 'network-1',
        statusCode: 200,
        statusMessage: 'OK',
        url: 'https://example.test/',
      })

      const encoded = codec.encodeResponse({
        ...response,
        url: 'https://example.test/response',
      })

      expect(encoded.url).to.equal('https://example.test/response')
    })

    it('copies bodySkipped from the transport response onto the neutral response', () => {
      const codec = createCdpFetchCodec()

      codec.decodeRequest({
        id: 'network-1',
        url: 'https://example.test/',
        method: 'GET',
        headers: {},
      })

      const response = codec.decodeResponse({
        id: 'network-1',
        url: 'https://example.test/',
        method: 'GET',
        headers: {},
        requestId: 'fetch-request',
        responseCode: 200,
        responseStatusText: 'OK',
        responseHeaders: [{ name: 'content-type', value: 'text/event-stream' }],
        bodySkipped: true,
      })

      expect(response.bodySkipped).to.be.true
    })

    // Shared by both cases below: decode a request/network-1 pair, then decode
    // its response with the given overrides layered on top of the same base.
    function decodeNetworkOneResponse (overrides: Record<string, any>) {
      const codec = createCdpFetchCodec()

      codec.decodeRequest({
        id: 'network-1',
        url: 'https://example.test/',
        method: 'GET',
        headers: {},
      })

      return codec.decodeResponse({
        id: 'network-1',
        url: 'https://example.test/',
        method: 'GET',
        headers: {},
        requestId: 'fetch-request',
        responseCode: 200,
        responsePhrase: 'OK',
        ...overrides,
      })
    }

    it('copies captureStream from the transport response onto the neutral response', () => {
      const captureStream = new Readable({ read () {} })

      const response = decodeNetworkOneResponse({
        responseHeaders: [{ name: 'content-type', value: 'text/event-stream' }],
        bodySkipped: true,
        captureStream,
      })

      expect(response.captureStream).to.equal(captureStream)
    })

    it('leaves captureStream unset on the neutral response when the transport response has none', () => {
      const response = decodeNetworkOneResponse({
        responseHeaders: [{ name: 'content-type', value: 'text/html' }],
      })

      // pins the conditional spread — a `captureStream: undefined` key would
      // pass a bare undefined check
      expect(response).to.not.have.property('captureStream')
    })

    // SSE relies on this: an unchanged empty body must digest-match the empty
    // origin body a skipped fetch produced, or every stream response would be
    // (wrongly) fulfilled instead of released to the browser untouched.
    it('continues (does not fulfill) a skipped response whose body was left untouched', () => {
      const codec = createCdpFetchCodec()

      codec.decodeRequest({
        id: 'network-1',
        url: 'https://example.test/',
        method: 'GET',
        headers: {},
      })

      const response = codec.decodeResponse({
        id: 'network-1',
        url: 'https://example.test/',
        method: 'GET',
        headers: {},
        requestId: 'fetch-request',
        responseCode: 200,
        responseStatusText: 'OK',
        responseHeaders: [{ name: 'content-type', value: 'text/event-stream' }],
        bodySkipped: true,
        originalBodyDigest: digestBody(Buffer.alloc(0)),
      })

      const encoded = codec.encodeResponse(response)

      expect(encoded.fulfilled).to.be.false
      expect(encoded.body).to.be.undefined
      // Unchanged headers are omitted so CDP keeps the browser's original set
      // rather than a reconstruction of it (same rule continueRequestHeaders
      // applies at the request stage).
      expect(encoded.responseHeaders).to.be.undefined
    })

    it('fulfills a skipped response when middleware sets a body', () => {
      const codec = createCdpFetchCodec()

      codec.decodeRequest({
        id: 'network-1',
        url: 'https://example.test/',
        method: 'GET',
        headers: {},
      })

      const response = codec.decodeResponse({
        id: 'network-1',
        url: 'https://example.test/',
        method: 'GET',
        headers: {},
        requestId: 'fetch-request',
        responseCode: 200,
        responseStatusText: 'OK',
        responseHeaders: [{ name: 'content-type', value: 'text/event-stream' }],
        bodySkipped: true,
        originalBodyDigest: digestBody(Buffer.alloc(0)),
      })

      const encoded = codec.encodeResponse({
        ...response,
        body: 'stubbed',
      })

      expect(encoded.fulfilled).to.be.true
      expect(encoded.body).to.equal(Buffer.from('stubbed').toString('base64'))
    })

    // A body we cannot prove came from the origin has to be fulfilled, or a
    // rewrite would be silently dropped in favor of the origin bytes.
    it('fulfills a response pause with no origin body digest to compare against', () => {
      const codec = createCdpFetchCodec()

      codec.decodeRequest({
        id: 'network-1',
        requestId: 'fetch-request',
        url: 'https://example.test/',
        method: 'GET',
        headers: {},
      })

      const response = codec.decodeResponse({
        id: 'network-1',
        url: 'https://example.test/',
        method: 'GET',
        headers: {},
        requestId: 'fetch-request',
        responseCode: 200,
        responseStatusText: 'OK',
        responseHeaders: [{
          name: 'content-type',
          value: 'text/plain',
        }],
      })

      const encoded = codec.encodeResponse({
        ...response,
        body: 'origin',
      })

      expect(encoded).to.deep.include({
        body: Buffer.from('origin').toString('base64'),
        fulfilled: true,
        responseCode: 200,
        responseStatusText: 'OK',
      })
    })

    it('encodes middleware short-circuits as fulfilled CDP responses', () => {
      const codec = createCdpFetchCodec()
      const transportRequest = {
        id: 'network-1',
        requestId: 'fetch-request',
        url: 'https://example.test/',
        method: 'GET',
        headers: {},
      }

      codec.decodeRequest(transportRequest)

      const encoded = codec.encodeResponse({
        id: 'network-1',
        url: 'https://example.test/stubbed',
        statusCode: 201,
        headers: {
          'content-type': 'text/plain',
          'set-cookie': ['a=1', 'b=2'],
        },
        body: 'created',
      })

      expect(encoded).to.deep.include({
        body: Buffer.from('created').toString('base64'),
        fulfilled: true,
        id: 'network-1',
        requestId: 'fetch-request',
        responseCode: 201,
        url: 'https://example.test/stubbed',
      })

      expect(encoded.responseHeaders).to.deep.equal([{
        name: 'content-type',
        value: 'text/plain',
      }, {
        name: 'set-cookie',
        value: 'a=1',
      }, {
        name: 'set-cookie',
        value: 'b=2',
      }])
    })

    it('releases CDP request state when the intercept pipeline fails', async () => {
      const codec = createCdpFetchCodec()
      const transportRequest = {
        id: 'network-1',
        url: 'https://example.test/',
        method: 'GET',
        headers: {},
      }

      codec.decodeRequest(transportRequest)
      codec.releaseRequest?.('network-1')

      expect(() => {
        codec.encodeRequest({
          id: 'network-1',
          url: 'https://example.test/mutated',
        })
      }).to.throw()
    })
  })

  // Fetch.enable is scoped to the session it is sent on, so every session
  // whose traffic must run the middleware onion needs its own enable — with
  // one shared pattern list, since a session pausing a different set of stages
  // than its siblings would silently skip middleware for that traffic.
  describe('session-scoped Fetch interception', () => {
    const FETCH_PATTERNS = {
      patterns: [{
        requestStage: 'Request',
      }, {
        requestStage: 'Response',
      }],
    }

    it('enables Fetch on its own session at start', async () => {
      const client = createClient()
      const { transport } = createTransport(client)

      await transport.start()

      expect(client.send).to.have.been.calledWith('Fetch.enable', FETCH_PATTERNS, undefined)
    })

    it('enables a service worker session with the same patterns as its own session', async () => {
      const client = createClient()
      const { transport } = createTransport(client)

      await transport.start()
      await transport.attachChildSession('sw-session')

      const enableCalls = client.send.getCalls().filter((call) => call.args[0] === 'Fetch.enable')

      expect(enableCalls).to.have.length(2)
      expect(enableCalls.map((call) => call.args[2])).to.deep.equal([undefined, 'sw-session'])
      // one pattern list for every session — not two that can drift apart
      expect(enableCalls[1].args[1]).to.equal(enableCalls[0].args[1])
      expect(enableCalls[1].args[1]).to.deep.equal(FETCH_PATTERNS)
    })

    // The caller (CriClient) wires onChildTargetAttached before awaiting
    // transport.start() (network-runtime.ts), so a service worker/iframe
    // attach can land in that window. Resolving here instead of rejecting
    // would let the caller commit a confirmation with no Fetch.enable behind
    // it - the caller already treats a rejected hook as no-commit, so
    // rejecting is what actually surfaces this as a failure rather than a
    // silent, unearned success.
    it('rejects, without enabling Fetch, when attached before the transport has started', async () => {
      const client = createClient()
      const { transport } = createTransport(client)

      await expect(transport.attachChildSession('sw-session')).to.be.rejected

      expect(client.send).not.to.have.been.calledWith('Fetch.enable')
    })

    // The window above isn't the only shape this race takes: start() can
    // already be running (not merely never begun) when the attach lands.
    // Rejecting outright here would treat that window as a hard failure when
    // it's really just early - awaiting the in-flight start instead lets the
    // attach succeed once it resolves.
    it('awaits an in-flight start() before enabling Fetch on a child session', async () => {
      const client = createClient()
      const { transport } = createTransport(client)

      const ownEnable = Promise.withResolvers<any>()

      client.send.withArgs('Fetch.enable', sinon.match.any, undefined).returns(ownEnable.promise)

      const starting = transport.start()
      const attaching = transport.attachChildSession('sw-session')

      await tick()

      // start() hasn't resolved yet - the child session's own enable must
      // not jump ahead of it
      expect(client.send).not.to.have.been.calledWith('Fetch.enable', sinon.match.any, 'sw-session')

      ownEnable.resolve({})

      await starting
      await attaching

      expect(client.send).to.have.been.calledWith('Fetch.enable', sinon.match.any, 'sw-session')
    })

    it('rejects an attach that was waiting on an in-flight start() that then fails', async () => {
      const client = createClient()
      const { transport } = createTransport(client)

      const ownEnable = Promise.withResolvers<any>()

      client.send.withArgs('Fetch.enable', sinon.match.any, undefined).returns(ownEnable.promise)

      const starting = transport.start()
      const attaching = transport.attachChildSession('sw-session')

      await tick()

      ownEnable.reject(new Error('ProtocolError: Inspected target closed'))

      await expect(starting).to.be.rejected
      await expect(attaching).to.be.rejected

      expect(client.send).not.to.have.been.calledWith('Fetch.enable', sinon.match.any, 'sw-session')
    })

    // stop() checks isStarted, which start() already flipped true before its
    // own enable resolves - so stop() can run and tear the transport back
    // down while an attach is still parked awaiting that same start. Without
    // re-checking isStarted after the wait, the parked attach would fall
    // through to enableFetch on a transport with no request-pause handlers
    // registered - a session that pauses requests forever.
    it('rejects a parked attach when stop() runs while its awaited start is still in flight', async () => {
      const client = createClient()
      const { transport } = createTransport(client)

      const ownEnable = Promise.withResolvers<any>()

      client.send.withArgs('Fetch.enable', sinon.match.any, undefined).returns(ownEnable.promise)

      const starting = transport.start()
      const attaching = transport.attachChildSession('sw-session')

      await tick()

      await transport.stop()

      ownEnable.resolve({})

      await starting

      await expect(attaching).to.be.rejected

      expect(client.send).not.to.have.been.calledWith('Fetch.enable', sinon.match.any, 'sw-session')
    })

    it('rejects when a service worker session cannot be enabled so the caller can report it', async () => {
      const client = createClient()
      const { transport } = createTransport(client)

      await transport.start()

      client.send.withArgs('Fetch.enable', sinon.match.any, 'sw-session')
      .rejects(new Error('ProtocolError: Inspected target closed'))

      await expect(transport.attachChildSession('sw-session'))
      .to.be.rejectedWith('Inspected target closed')
    })

    // The whole point of enabling per session rather than per transport: pauses
    // from every session land on the shared connection handlers, and each reply
    // has to go back to the session the pause came from.
    it('intercepts a service worker session pause and replies on that session', async () => {
      const client = createClient()
      const { transport } = createTransport(client)
      const onRequestPaused = await startTransport(transport, client)

      await transport.attachChildSession('sw-session')

      const handled = onRequestPaused(createPausedRequest({
        requestId: 'sw-fetch-request',
        networkId: 'sw-network-1',
        url: 'https://example.test/fixtures/service-worker.js',
      }), 'sw-session')

      await tick()

      expect(client.send).to.have.been.calledWith('Fetch.continueRequest', {
        requestId: 'sw-fetch-request',
      }, 'sw-session')

      await onRequestPaused(createPausedRequest({
        requestId: 'sw-fetch-request',
        networkId: 'sw-network-1',
        url: 'https://example.test/fixtures/service-worker.js',
        responseStatusCode: 200,
      }), 'sw-session')

      await handled

      expect(client.send).to.have.been.calledWith('Fetch.continueResponse', {
        requestId: 'sw-fetch-request',
        responseCode: 200,
      }, 'sw-session')
    })
  })

  describe('request pause handling', () => {
    it('continues the request and resolves the pending flow from a matching response pause', async () => {
      const client = createClient()
      const { transport } = createTransport(client)
      const request = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1' })
      const response = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1', responseStatusCode: 200 })
      const onRequestPaused = await startTransport(transport, client)

      const handled = onRequestPaused(request)

      await tick()

      expect(client.send).to.have.been.calledWith('Fetch.continueRequest', {
        requestId: 'fetch-request',
      })

      await onRequestPaused(response)
      await handled

      expect(client.send).to.have.been.calledWith('Fetch.continueResponse', {
        requestId: 'fetch-request',
        responseCode: 200,
      })
    })

    const interceptStatusMessage = async (responseStatusCode: number, responseStatusText: string) => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const { transport } = createTransport(client, { httpIntercept })
      const request = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1' })
      const response = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1', responseStatusCode, responseStatusText })

      let seenStatusMessage

      httpIntercept.use(async (req, next) => {
        const res = await next(req)

        seenStatusMessage = res.statusMessage

        return res
      })

      const onRequestPaused = await startTransport(transport, client)
      const handled = onRequestPaused(request)

      await tick()
      await onRequestPaused(response)
      await handled

      return seenStatusMessage
    }

    // A custom phrase must survive verbatim, not be replaced by the standard one.
    it('exposes the reason phrase the browser read off the wire as statusMessage', async () => {
      expect(await interceptStatusMessage(200, 'Totally Fine')).to.equal('Totally Fine')
    })

    it('reports an empty statusMessage when the protocol carries no reason phrase', async () => {
      expect(await interceptStatusMessage(200, '')).to.equal('')
    })

    it('marks AUT frame documents for the intercept pipeline without sending the header upstream', async () => {
      const client = createClient()
      const isAUTFrame = sinon.stub().withArgs('frame-1').resolves(true)
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const seenIsAutFrameHeader = sinon.stub()
      const { transport } = createTransport(client, { httpIntercept, isAUTFrame })
      const request = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1' })
      const response = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1', responseStatusCode: 200 })
      const onRequestPaused = await startTransport(transport, client)

      request.request.headers = {
        'X-Foo': 'Bar',
      }

      httpIntercept.use((req, next) => {
        seenIsAutFrameHeader(req.headers?.['x-cypress-is-aut-frame'])

        return next(req)
      })

      const handled = onRequestPaused(request)

      await tick()

      expect(isAUTFrame).to.have.been.calledOnceWith('frame-1')
      expect(seenIsAutFrameHeader).to.have.been.calledWith('true')
      // AUT marker must not leave the process toward the origin.
      expect(client.send).to.have.been.calledWith('Fetch.continueRequest', {
        requestId: 'fetch-request',
        headers: [{
          name: 'X-Foo',
          value: 'Bar',
        }],
      })

      await onRequestPaused(response)
      await handled
    })

    it('does not mark AUT-frame subresource requests (e.g. XHR) with the AUT frame header', async () => {
      const client = createClient()
      const isAUTFrame = sinon.stub().resolves(true)
      const { transport } = createTransport(client, { isAUTFrame })
      const request = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1', resourceType: 'XHR' })
      const response = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1', resourceType: 'XHR', responseStatusCode: 200 })
      const onRequestPaused = await startTransport(transport, client)

      const handled = onRequestPaused(request)

      await tick()

      expect(isAUTFrame).not.to.have.been.called
      expect(client.send).to.have.been.calledWith('Fetch.continueRequest', {
        requestId: 'fetch-request',
      })

      await onRequestPaused(response)
      await handled
    })

    it('normalizes CDP Fetch resourceType onto the transport request for cookie middleware', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const seenResourceTypes: Array<string | undefined> = []
      const { transport } = createTransport(client, { httpIntercept })
      const onRequestPaused = await startTransport(transport, client)

      httpIntercept.use((req, next) => {
        seenResourceTypes.push(req.resourceType)

        return next(req)
      })

      for (const cdpType of ['XHR', 'Fetch', 'Document'] as const) {
        const request = createPausedRequest({
          requestId: `fetch-${cdpType}`,
          networkId: `network-${cdpType}`,
          resourceType: cdpType,
        })
        const response = createPausedRequest({
          requestId: `fetch-${cdpType}`,
          networkId: `network-${cdpType}`,
          resourceType: cdpType,
          responseStatusCode: 200,
        })

        const handled = onRequestPaused(request)

        await tick()
        await onRequestPaused(response)
        await handled
      }

      expect(seenResourceTypes).to.deep.equal(['xhr', 'fetch', 'other'])
    })

    it('strips a previously injected AUT frame header on redirect re-pause', async () => {
      const client = createClient()
      const isAUTFrame = sinon.stub().withArgs('frame-1').resolves(true)
      const { transport } = createTransport(client, { isAUTFrame })
      const request = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1' })
      const response = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1', responseStatusCode: 200 })
      const onRequestPaused = await startTransport(transport, client)

      request.request.headers = {
        'X-Cypress-Is-AUT-Frame': 'true',
        'X-Foo': 'Bar',
      }

      const handled = onRequestPaused(request)

      await tick()

      expect(client.send).to.have.been.calledWith('Fetch.continueRequest', {
        requestId: 'fetch-request',
        headers: [{
          name: 'X-Foo',
          value: 'Bar',
        }],
      })

      await onRequestPaused(response)
      await handled
    })

    it('keeps mutated request headers without re-adding the AUT frame header upstream', async () => {
      const client = createClient()
      const isAUTFrame = sinon.stub().withArgs('frame-1').resolves(true)
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const { transport } = createTransport(client, { httpIntercept, isAUTFrame })
      const request = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1' })
      const response = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1', responseStatusCode: 200 })
      const onRequestPaused = await startTransport(transport, client)

      request.request.headers = {
        'X-Foo': 'Bar',
      }

      httpIntercept.use((req, next) => {
        return next({
          ...req,
          headers: {
            ...req.headers,
            'X-Mutated': '1',
          },
        })
      })

      const handled = onRequestPaused(request)

      await tick()

      expect(client.send).to.have.been.calledWith('Fetch.continueRequest', {
        requestId: 'fetch-request',
        headers: [{
          name: 'X-Foo',
          value: 'Bar',
        }, {
          name: 'X-Mutated',
          value: '1',
        }],
      })

      await onRequestPaused(response)
      await handled
    })

    it('marks extra-target requests for the intercept pipeline without sending the header upstream', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const seenExtraTargetHeader = sinon.stub()
      const { transport } = createTransport(client, { httpIntercept, isFromExtraTarget: true })
      const request = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1' })
      const response = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1', responseStatusCode: 200 })
      const onRequestPaused = await startTransport(transport, client)

      request.request.headers = {
        'X-Foo': 'Bar',
      }

      httpIntercept.use((req, next) => {
        seenExtraTargetHeader(req.headers?.['x-cypress-is-from-extra-target'])

        return next(req)
      })

      const handled = onRequestPaused(request)

      await tick()

      expect(seenExtraTargetHeader).to.have.been.calledWith('true')
      expect(client.send).to.have.been.calledWith('Fetch.continueRequest', {
        requestId: 'fetch-request',
        headers: [{
          name: 'X-Foo',
          value: 'Bar',
        }],
      })

      await onRequestPaused(response)
      await handled
    })

    it('does not mark requests with the extra-target header when isFromExtraTarget is unset', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const seenExtraTargetHeader = sinon.stub()
      const { transport } = createTransport(client, { httpIntercept })
      const request = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1' })
      const response = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1', responseStatusCode: 200 })
      const onRequestPaused = await startTransport(transport, client)

      httpIntercept.use((req, next) => {
        seenExtraTargetHeader(req.headers?.['x-cypress-is-from-extra-target'])

        return next(req)
      })

      const handled = onRequestPaused(request)

      await tick()

      expect(seenExtraTargetHeader).to.have.been.calledWith(undefined)
      expect(client.send).to.have.been.calledWith('Fetch.continueRequest', {
        requestId: 'fetch-request',
      })

      await onRequestPaused(response)
      await handled
    })

    it('strips a previously injected extra-target header on continueRequest', async () => {
      const client = createClient()
      const { transport } = createTransport(client, { isFromExtraTarget: true })
      const request = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1' })
      const response = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1', responseStatusCode: 200 })
      const onRequestPaused = await startTransport(transport, client)

      request.request.headers = {
        'X-Cypress-Is-From-Extra-Target': 'true',
        'X-Foo': 'Bar',
      }

      const handled = onRequestPaused(request)

      await tick()

      expect(client.send).to.have.been.calledWith('Fetch.continueRequest', {
        requestId: 'fetch-request',
        headers: [{
          name: 'X-Foo',
          value: 'Bar',
        }],
      })

      await onRequestPaused(response)
      await handled
    })

    it('namespaces HttpIntercept request ids for extra-target transports', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const seenIds: string[] = []
      const { transport } = createTransport(client, { httpIntercept, isFromExtraTarget: true })
      const request = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1' })
      const response = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1', responseStatusCode: 200 })
      const onRequestPaused = await startTransport(transport, client)

      httpIntercept.use((req, next) => {
        seenIds.push(req.id)

        return next(req)
      })

      const handled = onRequestPaused(request)

      await tick()

      expect(seenIds).to.have.length(1)
      expect(seenIds[0]).to.match(/^extra-[a-z0-9]+:network-1$/)
      expect(seenIds[0]).not.to.equal('network-1')

      await onRequestPaused(response)
      await handled
    })

    it('drops wire encoding headers from the middleware view and fulfilled responses', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const { transport } = createTransport(client, { httpIntercept })
      const request = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1' })
      const response = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1', responseStatusCode: 200 })

      response.responseHeaders = [
        { name: 'Content-Encoding', value: 'gzip' },
        { name: 'Content-Type', value: 'text/html' },
      ]

      let seenResponseHeaders

      httpIntercept.use(async (req, next) => {
        const res = await next(req)

        seenResponseHeaders = { ...res.headers }

        return { ...res, body: 'plain' }
      })

      const onRequestPaused = await startTransport(transport, client)
      const handled = onRequestPaused(request)

      await tick()
      await onRequestPaused(response)
      await handled

      expect(seenResponseHeaders).to.deep.equal({
        'content-type': 'text/html',
      })

      expect(client.send).to.have.been.calledWith('Fetch.fulfillRequest', {
        requestId: 'fetch-request',
        responseCode: 200,
        responsePhrase: 'OK',
        responseHeaders: [{
          name: 'content-type',
          value: 'text/html',
        }],
        body: Buffer.from('plain').toString('base64'),
      })
    })

    // Identity for fulfilled bodies is guaranteed upstream by the synthetic
    // proxy codec's decodeResponse, so the transport fulfills verbatim.
    it('fulfills pipeline bodies verbatim when middleware mutates the body', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const { transport } = createTransport(client, { httpIntercept })
      const request = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1' })
      const response = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1', responseStatusCode: 200 })

      client.send.withArgs('Fetch.getResponseBody').resolves({
        body: Buffer.from('<html>origin</html>').toString('base64'),
        base64Encoded: true,
      })

      httpIntercept.use(async (req, next) => {
        const res = await next(req)

        return {
          ...res,
          headers: {
            'content-type': 'text/html',
            'content-length': '9999',
          },
          body: Buffer.from('<html>plain</html>'),
        }
      })

      const onRequestPaused = await startTransport(transport, client)
      const handled = onRequestPaused(request)

      await tick()
      await onRequestPaused(response)
      await handled

      expect(client.send).to.have.been.calledWith('Fetch.fulfillRequest', {
        requestId: 'fetch-request',
        responseCode: 200,
        responsePhrase: 'OK',
        responseHeaders: [{
          name: 'content-type',
          value: 'text/html',
        }],
        body: Buffer.from('<html>plain</html>').toString('base64'),
      })
    })

    // Middleware never touched these headers, so continueResponse omits the
    // field entirely rather than resending a lowercased, re-folded copy of
    // the same wire-encoding headers CDP already has on the paused request.
    it('omits responseHeaders on pass-through continueResponse when middleware left them unchanged', async () => {
      const client = createClient()
      const { transport } = createTransport(client)
      const request = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1' })
      const response = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1', responseStatusCode: 200 })

      response.responseHeaders = [
        { name: 'Content-Encoding', value: 'gzip' },
        { name: 'Content-Type', value: 'text/html' },
      ]

      const onRequestPaused = await startTransport(transport, client)
      const handled = onRequestPaused(request)

      await tick()
      await onRequestPaused(response)
      await handled

      expect(client.send).to.have.been.calledWith('Fetch.continueResponse', {
        requestId: 'fetch-request',
        responseCode: 200,
      })

      expect(client.send).not.to.have.been.calledWith('Fetch.fulfillRequest')
    })

    // Network.responseReceived derives mimeType/charset from the wire
    // content-type; a continueResponse header override does not update them,
    // so a changed content-type must take the fulfill path to be recorded
    // truthfully (e.g. Test Replay keys stylesheet handling off mimeType).
    it('fulfills when middleware changes only the content-type of an untouched body', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const { transport } = createTransport(client, { httpIntercept })
      const onRequestPaused = await startTransport(transport, client)

      client.send.withArgs('Fetch.getResponseBody').resolves({
        body: Buffer.from('.x { color: red; }').toString('base64'),
        base64Encoded: true,
      })

      httpIntercept.use(async (req, next) => {
        const response = await next(req)

        return {
          ...response,
          body: await readStream(response.bodyStream!),
          headers: {
            ...response.headers,
            'content-type': 'text/css',
          },
        }
      })

      const handled = onRequestPaused(createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1' }))

      await tick()

      const response = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1', responseStatusCode: 200 })

      response.responseHeaders = [{ name: 'Content-Type', value: 'application/octet-stream' }]

      await onRequestPaused(response)
      await handled

      expect(client.send).to.have.been.calledWith('Fetch.fulfillRequest', {
        requestId: 'fetch-request',
        responseCode: 200,
        responsePhrase: 'OK',
        responseHeaders: [{
          name: 'content-type',
          value: 'text/css',
        }],
        body: Buffer.from('.x { color: red; }').toString('base64'),
      })

      expect(client.send).not.to.have.been.calledWith('Fetch.continueResponse')
    })

    // Overrides other than content-type are recorded truthfully by CDP on
    // continueResponse, so they keep the cheaper wire release.
    it('continues when middleware changes headers other than content-type', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const { transport } = createTransport(client, { httpIntercept })
      const onRequestPaused = await startTransport(transport, client)

      client.send.withArgs('Fetch.getResponseBody').resolves({
        body: Buffer.from('.x { color: red; }').toString('base64'),
        base64Encoded: true,
      })

      httpIntercept.use(async (req, next) => {
        const response = await next(req)

        return {
          ...response,
          body: await readStream(response.bodyStream!),
          headers: {
            ...response.headers,
            'x-custom': 'yes',
          },
        }
      })

      const handled = onRequestPaused(createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1' }))

      await tick()

      const response = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1', responseStatusCode: 200 })

      response.responseHeaders = [{ name: 'Content-Type', value: 'application/octet-stream' }]

      await onRequestPaused(response)
      await handled

      expect(client.send).to.have.been.calledWith('Fetch.continueResponse', {
        requestId: 'fetch-request',
        responseCode: 200,
        responseHeaders: [
          { name: 'content-type', value: 'application/octet-stream' },
          { name: 'x-custom', value: 'yes' },
        ],
      })

      expect(client.send).not.to.have.been.calledWith('Fetch.fulfillRequest')
    })

    it('matches request and response pauses by fetch request id', async () => {
      const client = createClient()
      const { transport } = createTransport(client)
      const onRequestPaused = await startTransport(transport, client)

      const handled = onRequestPaused(createPausedRequest({
        requestId: 'shared.0',
        networkId: 'shared-network-id',
      }))

      await tick()

      await onRequestPaused(createPausedRequest({
        requestId: 'shared.0',
        networkId: 'shared-network-id',
        responseStatusCode: 200,
      }))

      await handled

      expect(client.send).to.have.been.calledWith('Fetch.continueResponse', {
        requestId: 'shared.0',
        responseCode: 200,
      })
    })

    it('correlates request and response pauses by request id when network id is absent', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const seenIds: string[] = []
      const addPendingUrlWithoutPreRequest = sinon.stub()
      const { transport } = createTransport(client, { httpIntercept, addPendingUrlWithoutPreRequest })
      const onRequestPaused = await startTransport(transport, client)

      httpIntercept.use(async (req, next) => {
        seenIds.push(req.id)

        return next(req)
      })

      // Downloads omit networkId; Chromium still reuses the Fetch requestId across both pauses.
      const handled = onRequestPaused(createPausedRequest({
        requestId: 'download-pause-id',
        url: 'https://example.test/cypress/fixtures/records.csv',
      }))

      await tick()

      expect(addPendingUrlWithoutPreRequest).to.have.been.calledOnceWith(
        'https://example.test/cypress/fixtures/records.csv',
      )

      expect(client.send).to.have.been.calledWith('Fetch.continueRequest', {
        requestId: 'download-pause-id',
      })

      expect(seenIds).to.deep.equal(['download-pause-id'])

      await onRequestPaused(createPausedRequest({
        requestId: 'download-pause-id',
        url: 'https://example.test/cypress/fixtures/records.csv',
        responseStatusCode: 200,
      }))

      await handled

      expect(client.send).to.have.been.calledWith('Fetch.continueResponse', {
        requestId: 'download-pause-id',
        responseCode: 200,
      })
    })

    it('does not pre-register urls when network id is present', async () => {
      const client = createClient()
      const addPendingUrlWithoutPreRequest = sinon.stub()
      const { transport } = createTransport(client, { addPendingUrlWithoutPreRequest })
      const onRequestPaused = await startTransport(transport, client)

      const handled = onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
      }))

      await tick()

      expect(addPendingUrlWithoutPreRequest).not.to.have.been.called

      await onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
        responseStatusCode: 200,
      }))

      await handled
    })

    it('keeps concurrent requests isolated by network id', async () => {
      const client = createClient()
      const { transport } = createTransport(client)
      const onRequestPaused = await startTransport(transport, client)

      const firstHandled = onRequestPaused(createPausedRequest({
        requestId: 'first-request-pause-id',
        networkId: 'first-network-id',
      }))
      const secondHandled = onRequestPaused(createPausedRequest({
        requestId: 'second-request-pause-id',
        networkId: 'second-network-id',
      }))

      await tick()

      await onRequestPaused(createPausedRequest({
        requestId: 'second-request-pause-id',
        networkId: 'second-network-id',
        responseStatusCode: 201,
      }))

      await onRequestPaused(createPausedRequest({
        requestId: 'first-request-pause-id',
        networkId: 'first-network-id',
        responseStatusCode: 200,
      }))

      await Promise.all([firstHandled, secondHandled])

      expect(client.send).to.have.been.calledWith('Fetch.continueResponse', {
        requestId: 'first-request-pause-id',
        responseCode: 200,
      })

      expect(client.send).to.have.been.calledWith('Fetch.continueResponse', {
        requestId: 'second-request-pause-id',
        responseCode: 201,
      })
    })

    it('does not let a timed out redirect hop reject a newer hop with a distinct fetch request id', async () => {
      const clock = sinon.useFakeTimers()
      const client = createClient()
      const { transport } = createTransport(client)
      const onRequestPaused = await startTransport(transport, client)

      const firstHandled = onRequestPaused(createPausedRequest({
        requestId: 'first-request-pause-id',
        networkId: 'shared-network-id',
        url: 'https://example.test/redirect',
      }))

      await tick()
      await clock.tickAsync(1)

      const secondHandled = onRequestPaused(createPausedRequest({
        requestId: 'second-request-pause-id',
        networkId: 'shared-network-id',
        url: 'https://example.test/final',
      }))

      await tick()
      await clock.tickAsync(29999)
      await firstHandled

      await onRequestPaused(createPausedRequest({
        requestId: 'second-request-pause-id',
        networkId: 'shared-network-id',
        url: 'https://example.test/final',
        responseStatusCode: 200,
      }))

      await secondHandled

      expect(client.send).to.have.been.calledWith('Fetch.continueResponse', {
        requestId: 'second-request-pause-id',
        responseCode: 200,
      })
    })

    it('continues unmatched response pauses so the browser is not left paused', async () => {
      const client = createClient()
      const { transport } = createTransport(client)
      const onRequestPaused = await startTransport(transport, client)

      await onRequestPaused(createPausedRequest({
        requestId: 'response-pause-id',
        responseStatusCode: 204,
      }))

      expect(client.send).to.have.been.calledOnceWith('Fetch.continueResponse', {
        requestId: 'response-pause-id',
      })
    })

    it('fails unmatched response error pauses so the browser is not left paused', async () => {
      const client = createClient()
      const { transport } = createTransport(client)
      const onRequestPaused = await startTransport(transport, client)

      await onRequestPaused(createPausedRequest({
        requestId: 'response-pause-id',
        responseErrorReason: 'Aborted',
      }))

      expect(client.send).to.have.been.calledOnceWith('Fetch.failRequest', {
        requestId: 'response-pause-id',
        errorReason: 'Aborted',
      })

      expect(client.send).not.to.have.been.calledWith('Fetch.continueResponse')
    })

    it('treats status code 0 as a response pause', async () => {
      const client = createClient()
      const { transport } = createTransport(client)
      const onRequestPaused = await startTransport(transport, client)

      const handled = onRequestPaused(createPausedRequest({
        requestId: 'shared.0',
        networkId: 'shared-network-id',
      }))

      await tick()

      await onRequestPaused(createPausedRequest({
        requestId: 'shared.0',
        networkId: 'shared-network-id',
        responseStatusCode: 0,
      }))

      await handled

      expect(client.send).to.have.been.calledWith('Fetch.continueResponse', {
        requestId: 'shared.0',
        responseCode: 0,
        responsePhrase: 'unknown',
      })
    })

    it('merges set-cookie from the Network extraInfo event into the response pause headers', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const { transport, networkExtraInfo } = createTransport(client, { httpIntercept })
      const request = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1' })
      const response = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1', responseStatusCode: 200 })

      response.responseHeaders = [
        { name: 'Content-Type', value: 'text/plain' },
        // superseded by the raw wire headers from the extraInfo event
        { name: 'Set-Cookie', value: 'stale=1' },
      ]

      // devtools folds multiple Set-Cookie values into one newline-separated string
      networkExtraInfo.responseExtraInfo.resolves({
        requestId: 'network-1',
        headers: {
          'Set-Cookie': 'foo1=bar1; Domain=foobar.com\nfoo2=bar2',
        },
      })

      let seenResponseHeaders

      httpIntercept.use(async (req, next) => {
        const res = await next(req)

        seenResponseHeaders = { ...res.headers }

        return res
      })

      const onRequestPaused = await startTransport(transport, client)
      const handled = onRequestPaused(request, 'session-1')

      await tick()
      await onRequestPaused(response, 'session-1')
      await handled

      expect(networkExtraInfo.responseExtraInfo).to.have.been.calledOnceWith('network-1', 'session-1')

      expect(seenResponseHeaders).to.deep.equal({
        'content-type': 'text/plain',
        'set-cookie': ['foo1=bar1; Domain=foobar.com', 'foo2=bar2'],
      })

      // Middleware left the response untouched, so continueResponse omits responseHeaders.
      expect(client.send).to.have.been.calledWith('Fetch.continueResponse', {
        requestId: 'fetch-request',
        responseCode: 200,
      }, 'session-1')
    })

    it('exposes merged set-cookie headers to the intercept middleware', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const { transport, networkExtraInfo } = createTransport(client, { httpIntercept })
      const request = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1' })
      const response = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1', responseStatusCode: 200 })

      response.responseHeaders = [{ name: 'Content-Type', value: 'text/plain' }]

      networkExtraInfo.responseExtraInfo.resolves({
        requestId: 'network-1',
        headers: {
          'Set-Cookie': 'foo1=bar1; Domain=foobar.com\nfoo2=bar2',
        },
      })

      let seenResponseHeaders

      httpIntercept.use(async (req, next) => {
        const res = await next(req)

        seenResponseHeaders = { ...res.headers }

        return { ...res, body: 'ok' }
      })

      const onRequestPaused = await startTransport(transport, client)
      const handled = onRequestPaused(request)

      await tick()
      await onRequestPaused(response)
      await handled

      expect(seenResponseHeaders).to.deep.equal({
        'content-type': 'text/plain',
        'set-cookie': ['foo1=bar1; Domain=foobar.com', 'foo2=bar2'],
      })

      expect(client.send).to.have.been.calledWith('Fetch.fulfillRequest', {
        requestId: 'fetch-request',
        responseCode: 200,
        responsePhrase: 'OK',
        responseHeaders: [{
          name: 'content-type',
          value: 'text/plain',
        }, {
          name: 'set-cookie',
          value: 'foo1=bar1; Domain=foobar.com',
        }, {
          name: 'set-cookie',
          value: 'foo2=bar2',
        }],
        body: Buffer.from('ok').toString('base64'),
      })
    })

    it('keeps the response pause headers when the extraInfo carries no set-cookie', async () => {
      const client = createClient()
      const { transport, networkExtraInfo } = createTransport(client)
      const request = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1' })
      const response = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1', responseStatusCode: 200 })

      response.responseHeaders = [{ name: 'Content-Type', value: 'text/plain' }]

      networkExtraInfo.responseExtraInfo.resolves({
        requestId: 'network-1',
        headers: {
          'x-other': '1',
        },
      })

      const onRequestPaused = await startTransport(transport, client)
      const handled = onRequestPaused(request)

      await tick()
      await onRequestPaused(response)
      await handled

      // Nothing changed the headers, so continueResponse omits the field.
      expect(client.send).to.have.been.calledWith('Fetch.continueResponse', {
        requestId: 'fetch-request',
        responseCode: 200,
      })
    })

    it('releases the response pause when reset rejects the flow during the set-cookie merge', async () => {
      const client = createClient()
      const { transport, networkExtraInfo } = createTransport(client)

      let releaseMerge!: () => void

      // hold the merge open like a parked extraInfo waiter would
      networkExtraInfo.responseExtraInfo.callsFake(() => {
        return new Promise((resolve) => {
          releaseMerge = () => resolve(undefined)
        })
      })

      const onRequestPaused = await startTransport(transport, client)

      const handled = onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
      }))

      await tick()

      const responseHandled = onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
        responseStatusCode: 200,
      }))

      await tick()

      transport.reset()
      releaseMerge()

      await responseHandled
      await handled

      expect(client.send).to.have.been.calledWith('Fetch.continueResponse', {
        requestId: 'fetch-request',
      })
    })

    it('does not clear extraInfo tracking when a flow completes successfully', async () => {
      const client = createClient()
      const { transport, networkExtraInfo } = createTransport(client)
      const onRequestPaused = await startTransport(transport, client)

      const handled = onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'shared-network-id',
      }))

      await tick()

      await onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'shared-network-id',
        responseStatusCode: 302,
      }))

      await handled

      // redirect hops reuse the network id — the next hop's Network events may
      // already be tracked, and wiping here would drop that hop's Set-Cookie
      expect(networkExtraInfo.clear).not.to.have.been.called
    })

    // The MITM path performs the upstream request itself, so cy.intercept sees
    // Node's own connection error. The middleware must see the same thing here.
    it('rejects a response error pause with the Node-shaped network error', async () => {
      const client = createClient()
      let capturedError: (Error & { code?: string }) | undefined

      const httpIntercept = {
        handle: async (request: any, next: (outbound: any) => Promise<any>) => {
          try {
            return await next(request)
          } catch (err) {
            capturedError = err as Error & { code?: string }

            throw err
          }
        },
      }

      const { transport } = createTransport(client, { httpIntercept: httpIntercept as any })
      const onRequestPaused = await startTransport(transport, client)

      const handled = onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
        url: 'http://127.0.0.1:3333/should-err',
      }))

      await tick()

      await onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
        url: 'http://127.0.0.1:3333/should-err',
        responseErrorReason: 'ConnectionRefused',
      }))

      await handled

      expect(capturedError?.message).to.equal('connect ECONNREFUSED 127.0.0.1:3333')
      expect(capturedError?.code).to.equal('ECONNREFUSED')
    })

    it('clears extraInfo tracking when the flow ends in a response error pause', async () => {
      const client = createClient()
      const { transport, networkExtraInfo } = createTransport(client)
      const onRequestPaused = await startTransport(transport, client)

      const handled = onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
      }))

      await tick()

      await onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
        responseErrorReason: 'Failed',
      }))

      await handled

      // an errored flow gets no more pauses, so nothing else consumes its tracking
      expect(networkExtraInfo.clear).to.have.been.calledWith('network-1')
    })

    it('clears extraInfo tracking for unmatched response pauses', async () => {
      const client = createClient()
      const { transport, networkExtraInfo } = createTransport(client)
      const onRequestPaused = await startTransport(transport, client)

      // no request pause ever registered this network id
      await onRequestPaused(createPausedRequest({
        requestId: 'unmatched-response',
        networkId: 'network-9',
        responseStatusCode: 200,
      }))

      expect(client.send).to.have.been.calledWith('Fetch.continueResponse', {
        requestId: 'unmatched-response',
      })

      expect(networkExtraInfo.clear).to.have.been.calledWith('network-9')
    })

    it('sends a URL override when middleware mutates the neutral request URL', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const { transport } = createTransport(client, { httpIntercept })
      const request = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1' })
      const response = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1', responseStatusCode: 200 })
      const onRequestPaused = await startTransport(transport, client)

      httpIntercept.use((req, next) => {
        return next({
          ...req,
          url: 'https://example.test/mutated',
        })
      })

      const handled = onRequestPaused(request)

      await tick()

      expect(client.send).to.have.been.calledWith('Fetch.continueRequest', {
        requestId: 'fetch-request',
        url: 'https://example.test/mutated',
      })

      await onRequestPaused(response)

      await handled
    })

    it('sends header, method, and body overrides when middleware mutates the request', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const { transport } = createTransport(client, { httpIntercept })
      const request = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1' })
      const response = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1', responseStatusCode: 200 })
      const onRequestPaused = await startTransport(transport, client)

      httpIntercept.use((req, next) => {
        return next({
          ...req,
          method: 'POST',
          headers: {
            'accept-encoding': 'gzip, deflate',
            authorization: 'Basic abc123',
            cookie: 'session=1',
          },
          body: 'payload',
        })
      })

      const handled = onRequestPaused(request)

      await tick()

      // postData is a CDP binary param: base64 of the utf8 body, not the body
      expect(client.send).to.have.been.calledWith('Fetch.continueRequest', {
        requestId: 'fetch-request',
        method: 'POST',
        postData: Buffer.from('payload', 'utf8').toString('base64'),
        headers: [{
          name: 'accept-encoding',
          value: 'gzip, deflate',
        }, {
          name: 'authorization',
          value: 'Basic abc123',
        }, {
          name: 'cookie',
          value: 'session=1',
        }],
      })

      await onRequestPaused(response)
      await handled
    })

    it('sends header overrides when middleware mutates request headers in place', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const { transport } = createTransport(client, { httpIntercept })
      const request = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1' })
      const response = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1', responseStatusCode: 200 })
      const onRequestPaused = await startTransport(transport, client)

      request.request.headers = {
        accept: '*/*',
      }

      httpIntercept.use((req, next) => {
        req.headers!['accept-encoding'] = 'gzip, deflate'

        return next(req)
      })

      const handled = onRequestPaused(request)

      await tick()

      expect(client.send).to.have.been.calledWith('Fetch.continueRequest', {
        requestId: 'fetch-request',
        headers: [{
          name: 'accept',
          value: '*/*',
        }, {
          name: 'accept-encoding',
          value: 'gzip, deflate',
        }],
      })

      await onRequestPaused(response)
      await handled
    })

    it('continues the response pause when continueResponse fails after handle', async () => {
      const client = createClient()

      client.send.withArgs('Fetch.continueResponse', { requestId: 'fetch-request', responseCode: 200 }).rejects(new Error('continueResponse failed'))
      const { transport } = createTransport(client)
      const request = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1' })
      const response = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1', responseStatusCode: 200 })
      const onRequestPaused = await startTransport(transport, client)

      const handled = onRequestPaused(request)

      await tick()
      await onRequestPaused(response)
      await handled

      expect(client.send).to.have.been.calledWith('Fetch.continueResponse', {
        requestId: 'fetch-request',
        responseCode: 200,
      })

      expect(client.send).to.have.been.calledWith('Fetch.continueResponse', {
        requestId: 'fetch-request',
      })
    })

    it('continues the request with byte-accurate base64 when middleware sets a Buffer body', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const { transport } = createTransport(client, { httpIntercept })
      const onRequestPaused = await startTransport(transport, client)

      // bytes that a utf8 string round-trip would corrupt
      const binaryBody = Buffer.from([0x23, 0x02, 0xff, 0x00, 0x9c])

      httpIntercept.use(async (req, next) => {
        req.body = binaryBody

        return next(req)
      })

      const handled = onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
      }))

      await tick()
      await onRequestPaused(createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1', responseStatusCode: 200 }))
      await handled

      const continueArgs = client.send.getCalls().find((call) => call.args[0] === 'Fetch.continueRequest')?.args[1]

      expect(continueArgs.postData).to.equal(binaryBody.toString('base64'))
    })

    it('fails the request pause when middleware requests a network error', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const { transport } = createTransport(client, { httpIntercept })
      const onRequestPaused = await startTransport(transport, client)

      httpIntercept.use(async () => {
        // cy.intercept forceNetworkError tags its error so the transport maps
        // it to Fetch.failRequest instead of releasing the pause untouched
        const err: Error & { isForceNetworkError?: boolean } = new Error('forceNetworkError called')

        err.isForceNetworkError = true
        throw err
      })

      await onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
      }))

      expect(client.send).to.have.been.calledWith('Fetch.failRequest', {
        requestId: 'fetch-request',
        errorReason: 'Failed',
      })

      expect(client.send).not.to.have.been.calledWith('Fetch.continueRequest', {
        requestId: 'fetch-request',
      })
    })

    it('fails the response pause when a response handler requests a network error', async () => {
      // res.send({ forceNetworkError: true }) raises after the request has
      // continued, so the pause in hand is the response one — it must still
      // reach the page as a network error, not as the origin's response
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const { transport } = createTransport(client, { httpIntercept })
      const onRequestPaused = await startTransport(transport, client)

      httpIntercept.use(async (req, next) => {
        await next(req)

        const err: Error & { isForceNetworkError?: boolean } = new Error('forceNetworkError called')

        err.isForceNetworkError = true
        throw err
      })

      const handled = onRequestPaused(createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1' }))

      await tick()
      await onRequestPaused(createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1', responseStatusCode: 200 }))
      await handled

      expect(client.send).to.have.been.calledWith('Fetch.failRequest', {
        requestId: 'fetch-request',
        errorReason: 'Failed',
      })

      expect(client.send).not.to.have.been.calledWith('Fetch.continueResponse', {
        requestId: 'fetch-request',
      })
    })

    it('continues the request pause when middleware fails before the terminal path', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const { transport } = createTransport(client, { httpIntercept })
      const onRequestPaused = await startTransport(transport, client)

      httpIntercept.use(async () => {
        throw new Error('middleware failed')
      })

      await onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
      }))

      expect(client.send).to.have.been.calledWith('Fetch.continueRequest', {
        requestId: 'fetch-request',
      })

      expect(client.send).not.to.have.been.calledWith('Fetch.continueResponse')
    })

    it('fulfills the request pause when middleware returns a response without calling next', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const { transport } = createTransport(client, { httpIntercept })
      const onRequestPaused = await startTransport(transport, client)

      httpIntercept.use(async (req) => {
        return {
          ...req,
          body: 'created',
          headers: {
            'content-type': 'text/plain',
          },
          statusCode: 201,
        }
      })

      await onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
      }))

      expect(client.send).to.have.been.calledWith('Fetch.fulfillRequest', {
        requestId: 'fetch-request',
        responseCode: 201,
        responsePhrase: 'Created',
        responseHeaders: [{
          name: 'content-type',
          value: 'text/plain',
        }],
        body: Buffer.from('created').toString('base64'),
      })

      expect(client.send).not.to.have.been.calledWith('Fetch.continueResponse')
    })

    it('continues the response pause without running the intercept pipeline when the eager body fetch fails', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const middlewareSawResponse = sinon.stub()
      const { transport } = createTransport(client, { httpIntercept })
      const onRequestPaused = await startTransport(transport, client)
      const unhandled = sinon.stub()

      client.send.withArgs('Fetch.getResponseBody').rejects(new Error('Invalid InterceptionId.'))

      httpIntercept.use(async (req, next) => {
        const response = await next(req)

        middlewareSawResponse(response)

        return response
      })

      process.on('unhandledRejection', unhandled)

      try {
        const handled = onRequestPaused(createPausedRequest({
          requestId: 'fetch-request',
          networkId: 'network-1',
        }))

        await tick()

        await onRequestPaused(createPausedRequest({
          requestId: 'fetch-request',
          networkId: 'network-1',
          responseStatusCode: 200,
        }))

        await handled
        await new Promise((resolve) => setImmediate(resolve))

        expect(unhandled).not.to.have.been.called
      } finally {
        process.removeListener('unhandledRejection', unhandled)
      }

      // the eager fetch rejects before deferred.resolve, so the response never
      // reaches the intercept pipeline
      expect(middlewareSawResponse).not.to.have.been.called

      expect(client.send).to.have.been.calledWith('Fetch.continueResponse', {
        requestId: 'fetch-request',
      })

      expect(client.send).not.to.have.been.calledWith('Fetch.fulfillRequest')
    })

    it('hands middleware an empty body for redirect pauses instead of asking CDP for one', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const middlewareSawResponse = sinon.stub()
      const { transport } = createTransport(client, { httpIntercept })
      const onRequestPaused = await startTransport(transport, client)

      httpIntercept.use(async (req, next) => {
        const response = await next(req)

        middlewareSawResponse({
          body: await readStream(response.bodyStream!),
          bodySkipped: response.bodySkipped,
        })

        return response
      })

      const handled = onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
      }))

      await tick()

      const response = createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
        responseStatusCode: 302,
      })

      response.responseHeaders = [{ name: 'location', value: 'https://example.test/next' }]

      await onRequestPaused(response)

      await handled

      expect(client.send).not.to.have.been.calledWith('Fetch.getResponseBody')

      // Redirects are materialized and are not marked skipped:
      // MaybeSendRedirectToClient ends every 3xx-with-location before the
      // capture stage, so the marker would have no reader.
      expect(middlewareSawResponse).to.have.been.calledWith({
        body: '',
        bodySkipped: undefined,
      })

      // Middleware left the redirect's headers untouched, so continueResponse
      // omits the field and CDP keeps the browser's original location header.
      expect(client.send).to.have.been.calledWith('Fetch.continueResponse', {
        requestId: 'fetch-request',
        responseCode: 302,
      })
    })

    it('fetches the response body while the pause is still valid, even when nothing reads it', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const { transport } = createTransport(client, { httpIntercept })
      const onRequestPaused = await startTransport(transport, client)

      client.send.withArgs('Fetch.getResponseBody').resolves({
        body: Buffer.from('origin').toString('base64'),
        base64Encoded: true,
      })

      httpIntercept.use(async (req, next) => next(req))

      const handled = onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
      }))

      await tick()

      await onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
        responseStatusCode: 200,
      }))

      await handled

      expect(client.send).to.have.been.calledWith('Fetch.getResponseBody', {
        requestId: 'fetch-request',
      })
    })

    // Fetch.getResponseBody never resolves for a never-ending body (SSE), so
    // a deny-listed response pause must skip the eager fetch entirely instead
    // of wedging the pause (#34470).
    it('skips the eager body fetch and continues untouched for a deny-listed (SSE) response pause', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const middlewareSawResponse = sinon.stub()
      const { transport } = createTransport(client, { httpIntercept })
      const onRequestPaused = await startTransport(transport, client)

      httpIntercept.use(async (req, next) => {
        const response = await next(req)

        middlewareSawResponse({
          body: await readStream(response.bodyStream!),
          bodySkipped: response.bodySkipped,
        })

        return response
      })

      const handled = onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
      }))

      await tick()

      const response = createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
        responseStatusCode: 200,
      })

      response.responseHeaders = [{ name: 'content-type', value: 'text/event-stream' }]

      await onRequestPaused(response)

      await handled

      expect(client.send).not.to.have.been.calledWith('Fetch.getResponseBody')

      expect(client.send).to.have.been.calledWith('Fetch.continueResponse', {
        requestId: 'fetch-request',
        responseCode: 200,
      })

      expect(middlewareSawResponse).to.have.been.calledWith({
        body: '',
        bodySkipped: true,
      })
    })

    it('fulfills a stream-classified response when middleware sets a stub body', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const { transport } = createTransport(client, { httpIntercept })
      const onRequestPaused = await startTransport(transport, client)

      httpIntercept.use(async (req, next) => {
        const response = await next(req)

        return { ...response, body: 'stubbed' }
      })

      await driveResponsePause(onRequestPaused, {
        requestId: 'fetch-request',
        networkId: 'network-1',
        resourceType: 'Fetch',
      }, { headers: [{ name: 'content-type', value: 'text/event-stream' }] })

      expect(client.send).not.to.have.been.calledWith('Fetch.getResponseBody')

      expect(client.send).to.have.been.calledWith('Fetch.fulfillRequest', {
        requestId: 'fetch-request',
        responseCode: 200,
        responsePhrase: 'OK',
        responseHeaders: [{ name: 'content-type', value: 'text/event-stream' }],
        body: Buffer.from('stubbed').toString('base64'),
      })
    })

    // network-runtime composes shouldStreamBody's hasMatchingRoute from cy.intercept's
    // matchRoutes — simulated here with a closure standing in for that
    // composition, since matchRoutes itself is out of scope for this phase.
    it('materializes the body when the shouldStreamBody option reports false, overriding the stream default', async () => {
      const client = createClient()
      const shouldStreamBody = sinon.stub().returns(false)
      const { transport } = createTransport(client, { shouldStreamBody })
      const onRequestPaused = await startTransport(transport, client)

      client.send.withArgs('Fetch.getResponseBody').resolves({
        body: Buffer.from('origin').toString('base64'),
        base64Encoded: true,
      })

      // Would classify 'stream' by default (deny-listed) — the option must win.
      const response = await driveResponsePause(onRequestPaused, {
        requestId: 'fetch-request',
        networkId: 'network-1',
      }, { headers: [{ name: 'content-type', value: 'text/event-stream' }] })

      expect(shouldStreamBody).to.have.been.calledWith(response)

      expect(client.send).to.have.been.calledWith('Fetch.getResponseBody', {
        requestId: 'fetch-request',
      })
    })

    // network-runtime's real request-stage middleware (SetMatchingRoutes) sets
    // req.matchingRoutes; the synthetic codec threads that into hadMatchingRoutes
    // on the neutral request once middleware has run (M4). This pins the wiring
    // from there through to the response pause's shouldStreamBody call, using a
    // stand-in middleware in place of the real net-stubbing pipeline.
    it('threads a request-stage route match through to shouldStreamBody as hasMatchingRoute', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const shouldStreamBody = sinon.stub().returns(false)
      const { transport } = createTransport(client, { httpIntercept, shouldStreamBody })
      const onRequestPaused = await startTransport(transport, client)

      client.send.withArgs('Fetch.getResponseBody').resolves({
        body: Buffer.from('origin').toString('base64'),
        base64Encoded: true,
      })

      httpIntercept.use((req, next) => next({ ...req, hadMatchingRoutes: true }))

      await driveResponsePause(onRequestPaused, {
        requestId: 'fetch-request',
        networkId: 'network-1',
      })

      expect(shouldStreamBody).to.have.been.calledWith(sinon.match.any, { hasMatchingRoute: true })
    })

    describe('body capture arming', () => {
      it('arms the capture pump for a stream-classified response when shouldCaptureBody opts in', async () => {
        const client = createClient()
        const { httpIntercept, getResponse } = captureRawResponseIntercept()

        const { transport } = createTransport(client, {
          httpIntercept,
          shouldStreamBody: () => true,
          shouldCaptureBody: () => true,
        })
        const onRequestPaused = await startTransport(transport, client)

        await driveResponsePause(onRequestPaused, {
          requestId: 'fetch-request',
          networkId: 'network-1',
        }, {}, 'session-1')

        expect(client.send).to.have.been.calledWith('Network.streamResourceContent', {
          requestId: 'network-1',
        }, 'session-1')

        // The load-bearing invariant: nothing flows over Network.dataReceived
        // until the pause is released, so an arm sent after continueResponse
        // would lose the opening bytes.
        const armIndex = client.send.getCalls().findIndex((call) => call.args[0] === 'Network.streamResourceContent')
        const releaseIndex = client.send.getCalls().findIndex((call) => call.args[0] === 'Fetch.continueResponse')

        expect(armIndex).to.be.greaterThan(-1)
        expect(releaseIndex).to.be.greaterThan(armIndex)

        expect(getResponse().captureStream).to.exist

        const chunks: Buffer[] = []

        getResponse().captureStream.on('data', (chunk: Buffer) => chunks.push(chunk))

        const dataReceivedHandler = client.on.withArgs('Network.dataReceived').getCall(0).args[1]

        dataReceivedHandler({
          requestId: 'network-1',
          data: Buffer.from('captured-chunk').toString('base64'),
        }, 'session-1')

        await tick()

        expect(Buffer.concat(chunks).toString()).to.equal('captured-chunk')
      })

      it('does not arm the capture pump when shouldCaptureBody is unset (default)', async () => {
        const client = createClient()
        const { transport } = createTransport(client, {
          shouldStreamBody: () => true,
        })
        const onRequestPaused = await startTransport(transport, client)

        await driveResponsePause(onRequestPaused, {
          requestId: 'fetch-request',
          networkId: 'network-1',
        })

        expect(client.send).not.to.have.been.calledWith('Network.streamResourceContent')
      })

      it('resolves the response and still continues the pause when arming the capture pump fails', async () => {
        const client = createClient()

        client.send.withArgs('Network.streamResourceContent').rejects(new Error('No resource with given identifier found'))

        const { httpIntercept, getResponse } = captureRawResponseIntercept()

        const { transport } = createTransport(client, {
          httpIntercept,
          shouldStreamBody: () => true,
          shouldCaptureBody: () => true,
        })
        const onRequestPaused = await startTransport(transport, client)

        await driveResponsePause(onRequestPaused, {
          requestId: 'fetch-request',
          networkId: 'network-1',
        })

        expect(getResponse().captureStream).to.be.undefined

        expect(client.send).to.have.been.calledWith('Fetch.continueResponse', {
          requestId: 'fetch-request',
          responseCode: 200,
        })
      })

      it('does not attempt to arm the capture pump when the pause carries no networkId', async () => {
        const client = createClient()
        const addPendingUrlWithoutPreRequest = sinon.stub()
        const { transport } = createTransport(client, {
          shouldStreamBody: () => true,
          shouldCaptureBody: () => true,
          addPendingUrlWithoutPreRequest,
        })
        const onRequestPaused = await startTransport(transport, client)

        await driveResponsePause(onRequestPaused, {
          requestId: 'download-pause-id',
          url: 'https://example.test/cypress/fixtures/records.csv',
        })

        expect(client.send).not.to.have.been.calledWith('Network.streamResourceContent')
      })

      // The one place bodySkipped-adjacent handling and disposition diverge:
      // a redirect's body is CDP-withheld, not browser-streamed, so there is
      // nothing for the pump to capture.
      it('does not arm the capture pump for a redirect pause even when capture is on', async () => {
        const client = createClient()
        const { transport } = createTransport(client, {
          shouldCaptureBody: () => true,
        })
        const onRequestPaused = await startTransport(transport, client)

        await driveResponsePause(onRequestPaused, {
          requestId: 'fetch-request',
          networkId: 'network-1',
        }, { statusCode: 302, headers: [{ name: 'location', value: 'https://example.test/next' }] })

        expect(client.send).not.to.have.been.calledWith('Network.streamResourceContent')
      })

      it('releases a freshly armed capture when reset() rejects the flow during the arm await', async () => {
        const client = createClient()
        const armGate = Promise.withResolvers<any>()

        client.send.withArgs('Network.streamResourceContent').returns(armGate.promise)

        const { transport, bodyCapture } = createTransport(client, {
          shouldStreamBody: () => true,
          shouldCaptureBody: () => true,
        })
        const releaseSpy = sinon.spy(bodyCapture, 'release')
        const onRequestPaused = await startTransport(transport, client)

        const handled = onRequestPaused(createPausedRequest({
          requestId: 'fetch-request',
          networkId: 'network-1',
        }))

        handled.catch(() => {})

        await tick()

        const responded = onRequestPaused(createPausedRequest({
          requestId: 'fetch-request',
          networkId: 'network-1',
          responseStatusCode: 200,
        }))

        await tick()

        // the flow is rejected while Network.streamResourceContent is in flight
        transport.reset()
        armGate.resolve({ bufferedData: '' })

        await responded

        expect(releaseSpy).to.have.been.calledWith('network-1', undefined)

        // the orphaned pause is released rather than left wedging the browser
        expect(client.send).to.have.been.calledWith('Fetch.continueResponse', {
          requestId: 'fetch-request',
        })
      })

      // a browser cancel rejects the flow but leaves inFlightRequests intact,
      // so the fetch-id check alone cannot see it — only the network key is
      // dropped, and loadingFailed arrives before the entry exists so the
      // pump's own reap never runs either
      it('releases a freshly armed capture when the browser cancels during the arm await', async () => {
        const client = createClient()
        const armGate = Promise.withResolvers<any>()

        client.send.withArgs('Network.streamResourceContent').returns(armGate.promise)

        const { transport, bodyCapture } = createTransport(client, {
          shouldStreamBody: () => true,
          shouldCaptureBody: () => true,
        })
        const releaseSpy = sinon.spy(bodyCapture, 'release')
        const onRequestPaused = await startTransport(transport, client)

        const handled = onRequestPaused(createPausedRequest({
          requestId: 'fetch-request',
          networkId: 'network-1',
        }))

        handled.catch(() => {})

        await tick()

        const responded = onRequestPaused(createPausedRequest({
          requestId: 'fetch-request',
          networkId: 'network-1',
          responseStatusCode: 200,
        }))

        await tick()

        onLoadingFailed(client, { requestId: 'network-1', canceled: true })
        armGate.resolve({ bufferedData: '' })

        await responded

        expect(releaseSpy).to.have.been.calledWith('network-1', undefined)

        expect(client.send).to.have.been.calledWith('Fetch.continueResponse', {
          requestId: 'fetch-request',
        })
      })

      it('resets and stops the capture pump with the transport lifecycle', async () => {
        const client = createClient()
        const bodyCapture = new CdpBodyCapture(client as any)
        const startSpy = sinon.spy(bodyCapture, 'start')
        const stopSpy = sinon.spy(bodyCapture, 'stop')
        const resetSpy = sinon.spy(bodyCapture, 'reset')

        const { transport } = createTransport(client, { bodyCapture })

        await transport.start()
        expect(startSpy).to.have.been.calledOnce

        transport.reset()
        expect(resetSpy).to.have.been.calledOnce

        await transport.stop()
        expect(stopSpy).to.have.been.calledOnce
        // stop() resets internally — the second call is expected, not a leak
        expect(resetSpy).to.have.been.calledTwice
      })
    })

    it('does not charge the response body transfer against the response pause timeout', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const { transport } = createTransport(client, { httpIntercept })
      const onRequestPaused = await startTransport(transport, client)
      const slowBody = Promise.withResolvers<any>()

      client.send.withArgs('Fetch.getResponseBody').returns(slowBody.promise)

      httpIntercept.use(async (req, next) => next(req))

      const clock = sinon.useFakeTimers({ shouldAdvanceTime: false })

      try {
        const handled = onRequestPaused(createPausedRequest({
          requestId: 'fetch-request',
          networkId: 'network-1',
        }))

        await clock.tickAsync(0)

        const responded = onRequestPaused(createPausedRequest({
          requestId: 'fetch-request',
          networkId: 'network-1',
          responseStatusCode: 200,
        }))

        // the pause already arrived, so a body slower than the 30s pause
        // timeout must not fail the flow
        await clock.tickAsync(31000)

        slowBody.resolve({ body: '', base64Encoded: false })

        await responded
        await handled
      } finally {
        clock.restore()
      }

      expect(client.send).to.have.been.calledWith('Fetch.continueResponse', {
        requestId: 'fetch-request',
        responseCode: 200,
      })
    })

    it('exposes response pause bodies as a stream for middleware rewrites', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const { transport } = createTransport(client, { httpIntercept })
      const onRequestPaused = await startTransport(transport, client)

      client.send.withArgs('Fetch.getResponseBody').resolves({
        body: Buffer.from('origin').toString('base64'),
        base64Encoded: true,
      })

      httpIntercept.use(async (req, next) => {
        const response = await next(req)

        return {
          ...response,
          body: `${await readStream(response.bodyStream!)}-rewritten`,
          headers: {
            'content-type': 'text/plain',
          },
          statusCode: 202,
        }
      })

      const handled = onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
      }))

      await tick()

      await onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
        responseStatusCode: 200,
      }))

      await handled

      expect(client.send).to.have.been.calledWith('Fetch.getResponseBody', {
        requestId: 'fetch-request',
      })

      expect(client.send).not.to.have.been.calledWith('Fetch.takeResponseBodyAsStream')

      expect(client.send).to.have.been.calledWith('Fetch.fulfillRequest', {
        requestId: 'fetch-request',
        responseCode: 202,
        responsePhrase: 'Accepted',
        responseHeaders: [{
          name: 'content-type',
          value: 'text/plain',
        }],
        body: Buffer.from('origin-rewritten').toString('base64'),
      })
    })

    it('continues verbatim empty response bodies without stalling', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const { transport } = createTransport(client, { httpIntercept })
      const onRequestPaused = await startTransport(transport, client)

      client.send.withArgs('Fetch.getResponseBody').resolves({
        body: '',
        base64Encoded: true,
      })

      httpIntercept.use(async (req, next) => {
        const response = await next(req)

        return {
          ...response,
          body: await readStream(response.bodyStream!),
          // a content-type change would force the fulfill path (mimeType
          // derivation) — use a neutral header to stay on continueResponse
          headers: {
            'x-verbatim': 'empty',
          },
          statusCode: 204,
        }
      })

      const handled = onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
      }))

      await tick()

      await onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
        responseStatusCode: 204,
      }))

      await handled

      expect(client.send).to.have.been.calledWith('Fetch.getResponseBody', {
        requestId: 'fetch-request',
      })

      expect(client.send).to.have.been.calledWith('Fetch.continueResponse', {
        requestId: 'fetch-request',
        responseCode: 204,
        responseHeaders: [{
          name: 'x-verbatim',
          value: 'empty',
        }],
      })

      expect(client.send).not.to.have.been.calledWith('Fetch.fulfillRequest')
    })

    it('rejects the pending flow from a matching response failure pause', async () => {
      const client = createClient()
      const { transport } = createTransport(client)
      const onRequestPaused = await startTransport(transport, client)

      const handled = onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
      }))

      await tick()

      await onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
        responseErrorReason: 'Aborted',
      }))

      await handled

      expect(client.send).to.have.been.calledWith('Fetch.failRequest', {
        requestId: 'fetch-request',
        errorReason: 'Aborted',
      })

      expect(client.send).not.to.have.been.calledWith('Fetch.continueResponse')
    })

    it('rejects the pending flow when failing the response pause throws', async () => {
      const client = createClient()

      client.send.withArgs('Fetch.failRequest').rejects(new Error('failRequest failed'))
      const { transport } = createTransport(client)
      const onRequestPaused = await startTransport(transport, client)

      const handled = onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
      }))

      await tick()

      await onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
        responseErrorReason: 'Aborted',
      }))

      await handled

      expect(client.send).to.have.been.calledWith('Fetch.failRequest', {
        requestId: 'fetch-request',
        errorReason: 'Aborted',
      })
    })

    it('resolves the handler after stop rejects in-flight flows', async () => {
      const client = createClient()
      const { transport } = createTransport(client)
      const onRequestPaused = await startTransport(transport, client)

      const handled = onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
      }))

      await tick()
      await transport.stop()
      await handled

      expect(client.send).to.have.been.calledWith('Fetch.disable')
    })

    it('does not produce an unhandled rejection when reset fires before the request continues', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const { transport } = createTransport(client, { httpIntercept })

      let releaseMiddleware!: () => void

      httpIntercept.use(async (req, next) => {
        await new Promise<void>((resolve) => {
          releaseMiddleware = resolve
        })

        return next(req)
      })

      const onRequestPaused = await startTransport(transport, client)
      const unhandled = sinon.stub()

      process.on('unhandledRejection', unhandled)

      try {
        const handled = onRequestPaused(createPausedRequest({
          requestId: 'fetch-request',
          networkId: 'network-1',
        }))

        await tick()

        transport.reset()

        await new Promise((resolve) => setImmediate(resolve))

        expect(unhandled).not.to.have.been.called

        releaseMiddleware()
        await handled
      } finally {
        process.removeListener('unhandledRejection', unhandled)
      }
    })

    it('clears in-flight flows on reset without disabling Fetch', async () => {
      const client = createClient()
      const { transport, networkExtraInfo } = createTransport(client)
      const onRequestPaused = await startTransport(transport, client)

      const handled = onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
      }))

      await tick()
      client.send.resetHistory()

      transport.reset()
      await handled

      expect(client.send).not.to.have.been.calledWith('Fetch.disable')
      expect(client.off).not.to.have.been.called
      // reset must release the layer's parked waiters, not unhook it
      expect(networkExtraInfo.flush).to.have.been.calledOnce
      expect(networkExtraInfo.stop).not.to.have.been.called

      client.send.resetHistory()

      const nextHandled = onRequestPaused(createPausedRequest({
        requestId: 'fetch-request-2',
        networkId: 'network-2',
      }))

      await tick()

      expect(client.send).to.have.been.calledWith('Fetch.continueRequest', {
        requestId: 'fetch-request-2',
      })

      await onRequestPaused(createPausedRequest({
        requestId: 'fetch-request-2',
        networkId: 'network-2',
        responseStatusCode: 200,
      }))

      await nextHandled
    })

    it('disables Fetch before removing handlers on stop', async () => {
      const client = createClient()
      const { transport, networkExtraInfo } = createTransport(client)

      await transport.start()
      client.send.resetHistory()

      await transport.stop()

      expect(client.send).to.have.been.calledWith('Fetch.disable')
      expect(client.off).to.have.been.calledWith('Fetch.requestPaused')
      expect(networkExtraInfo.stop).to.have.been.calledOnce
    })

    it('does not register duplicate handlers on repeated start', async () => {
      const client = createClient()
      const { transport, networkExtraInfo } = createTransport(client)

      await transport.start()
      await transport.start()

      expect(client.send).to.have.been.calledOnceWith('Fetch.enable', {
        patterns: [{
          requestStage: 'Request',
        }, {
          requestStage: 'Response',
        }],
      })

      expect(client.on.getCalls().map((call) => call.args[0])).to.deep.equal([
        'Fetch.requestPaused',
        'Fetch.requestPaused',
        'Network.loadingFailed',
        'Network.dataReceived',
        'Network.loadingFinished',
        'Network.loadingFailed',
      ])

      expect(networkExtraInfo.start).to.have.been.calledOnce
    })

    it('rolls back handlers when Fetch.enable fails so start can be retried', async () => {
      const client = createClient()

      client.send.onCall(0).rejects(new Error('enable failed'))
      const { transport, networkExtraInfo } = createTransport(client)

      await expect(transport.start()).to.be.rejectedWith('enable failed')

      expect(client.off).to.have.been.calledWith('Fetch.requestPaused')
      expect(networkExtraInfo.stop).to.have.been.calledOnce

      client.send.resetBehavior()
      client.send.resolves({})
      client.send.resetHistory()
      client.on.resetHistory()
      client.off.resetHistory()

      await transport.start()

      expect(client.send).to.have.been.calledOnceWith('Fetch.enable', {
        patterns: [{
          requestStage: 'Request',
        }, {
          requestStage: 'Response',
        }],
      })

      expect(client.on.getCalls().map((call) => call.args[0])).to.deep.equal([
        'Fetch.requestPaused',
        'Fetch.requestPaused',
        'Network.loadingFailed',
        'Network.dataReceived',
        'Network.loadingFinished',
        'Network.loadingFailed',
      ])

      expect(networkExtraInfo.start).to.have.been.calledTwice
      expect(client.off).not.to.have.been.called
    })

    it('continues when middleware returns verbatim body bytes from getResponseBody', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const { transport } = createTransport(client, { httpIntercept })
      const originBody = Buffer.from('origin-bytes')

      client.send.withArgs('Fetch.getResponseBody').resolves({
        body: originBody.toString('base64'),
        base64Encoded: true,
      })

      httpIntercept.use(async (req, next) => {
        const response = await next(req)

        return {
          ...response,
          body: await readStream(response.bodyStream!),
        }
      })

      const onRequestPaused = await startTransport(transport, client)
      const handled = onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
      }))

      await tick()

      await onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
        responseStatusCode: 200,
      }))

      await handled

      expect(client.send).to.have.been.calledWith('Fetch.continueResponse', {
        requestId: 'fetch-request',
        responseCode: 200,
      })

      expect(client.send).not.to.have.been.calledWith('Fetch.fulfillRequest')
    })

    it('fulfills when middleware mutates the response body', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const { transport } = createTransport(client, { httpIntercept })

      client.send.withArgs('Fetch.getResponseBody').resolves({
        body: Buffer.from('origin').toString('base64'),
        base64Encoded: true,
      })

      httpIntercept.use(async (req, next) => {
        const response = await next(req)

        return {
          ...response,
          body: 'mutated',
          headers: {
            'content-type': 'text/plain',
          },
        }
      })

      const onRequestPaused = await startTransport(transport, client)
      const handled = onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
      }))

      await tick()

      await onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
        responseStatusCode: 200,
      }))

      await handled

      expect(client.send).to.have.been.calledWith('Fetch.fulfillRequest', {
        requestId: 'fetch-request',
        responseCode: 200,
        responsePhrase: 'OK',
        responseHeaders: [{
          name: 'content-type',
          value: 'text/plain',
        }],
        body: Buffer.from('mutated').toString('base64'),
      })
    })

    it('fulfills when middleware returns same-length but different body bytes', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const { transport } = createTransport(client, { httpIntercept })

      client.send.withArgs('Fetch.getResponseBody').resolves({
        body: Buffer.from('aaaa').toString('base64'),
        base64Encoded: true,
      })

      httpIntercept.use(async (req, next) => {
        const response = await next(req)

        return {
          ...response,
          body: 'bbbb',
          headers: {
            'content-type': 'text/plain',
          },
        }
      })

      const onRequestPaused = await startTransport(transport, client)
      const handled = onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
      }))

      await tick()

      await onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
        responseStatusCode: 200,
      }))

      await handled

      expect(client.send).to.have.been.calledWith('Fetch.fulfillRequest', {
        requestId: 'fetch-request',
        responseCode: 200,
        responsePhrase: 'OK',
        responseHeaders: [{
          name: 'content-type',
          value: 'text/plain',
        }],
        body: Buffer.from('bbbb').toString('base64'),
      })
    })

    it('continues with merged headers when middleware mutates headers but not body bytes', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const { transport } = createTransport(client, { httpIntercept })
      const request = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1' })
      const response = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1', responseStatusCode: 200 })

      response.responseHeaders = [
        { name: 'Content-Encoding', value: 'gzip' },
        { name: 'Content-Length', value: '26' },
        { name: 'Content-Type', value: 'text/html' },
      ]

      client.send.withArgs('Fetch.getResponseBody').resolves({
        body: Buffer.from('origin').toString('base64'),
        base64Encoded: true,
      })

      httpIntercept.use(async (req, next) => {
        const res = await next(req)

        return {
          ...res,
          body: await readStream(res.bodyStream!),
          headers: {
            'content-type': 'text/html',
            'content-length': '6',
            'x-custom': '1',
          },
        }
      })

      const onRequestPaused = await startTransport(transport, client)
      const handled = onRequestPaused(request)

      await tick()
      await onRequestPaused(response)
      await handled

      // the browser replays the origin's wire body, so the pause's encoding and
      // length headers win over the ones describing the decoded middleware view
      expect(client.send).to.have.been.calledWith('Fetch.continueResponse', {
        requestId: 'fetch-request',
        responseCode: 200,
        responseHeaders: [{
          name: 'content-type',
          value: 'text/html',
        }, {
          name: 'x-custom',
          value: '1',
        }, {
          name: 'Content-Encoding',
          value: 'gzip',
        }, {
          name: 'Content-Length',
          value: '26',
        }],
      })

      expect(client.send).not.to.have.been.calledWith('Fetch.fulfillRequest')
    })

    it('continues with a new status code when middleware mutates status but not body bytes', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const { transport } = createTransport(client, { httpIntercept })

      client.send.withArgs('Fetch.getResponseBody').resolves({
        body: Buffer.from('origin').toString('base64'),
        base64Encoded: true,
      })

      httpIntercept.use(async (req, next) => {
        const response = await next(req)

        return {
          ...response,
          body: await readStream(response.bodyStream!),
          statusCode: 418,
        }
      })

      const onRequestPaused = await startTransport(transport, client)
      const handled = onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
      }))

      await tick()

      await onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
        responseStatusCode: 200,
      }))

      await handled

      expect(client.send).to.have.been.calledWith('Fetch.continueResponse', {
        requestId: 'fetch-request',
        responseCode: 418,
      })

      expect(client.send).not.to.have.been.calledWith('Fetch.fulfillRequest')
    })

    it('omits responseHeaders on continueResponse when middleware headers match the pause headers', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const { transport } = createTransport(client, { httpIntercept })
      const request = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1' })
      const response = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1', responseStatusCode: 200 })

      response.responseHeaders = [{ name: 'Content-Type', value: 'text/plain' }]

      httpIntercept.use(async (req, next) => {
        const res = await next(req)

        return { ...res, headers: { ...res.headers } }
      })

      const onRequestPaused = await startTransport(transport, client)
      const handled = onRequestPaused(request)

      await tick()
      await onRequestPaused(response)
      await handled

      expect(client.send).to.have.been.calledWith('Fetch.continueResponse', {
        requestId: 'fetch-request',
        responseCode: 200,
      })
    })

    it('includes responseHeaders on continueResponse when middleware changes a header value', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const { transport } = createTransport(client, { httpIntercept })
      const request = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1' })
      const response = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1', responseStatusCode: 200 })

      response.responseHeaders = [{ name: 'Content-Type', value: 'text/plain' }]

      httpIntercept.use(async (req, next) => {
        const res = await next(req)

        return { ...res, headers: { 'content-type': 'application/json' } }
      })

      const onRequestPaused = await startTransport(transport, client)
      const handled = onRequestPaused(request)

      await tick()
      await onRequestPaused(response)
      await handled

      expect(client.send).to.have.been.calledWith('Fetch.continueResponse', {
        requestId: 'fetch-request',
        responseCode: 200,
        responseHeaders: [{
          name: 'content-type',
          value: 'application/json',
        }],
      })
    })

    it('treats a header set differing only by name casing and order as unchanged', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const { transport } = createTransport(client, { httpIntercept })
      const request = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1' })
      const response = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1', responseStatusCode: 200 })

      response.responseHeaders = [
        { name: 'Content-Type', value: 'text/plain' },
        { name: 'X-Custom', value: '1' },
      ]

      httpIntercept.use(async (req, next) => {
        const res = await next(req)

        return {
          ...res,
          headers: {
            'x-custom': '1',
            'content-type': 'text/plain',
          },
        }
      })

      const onRequestPaused = await startTransport(transport, client)
      const handled = onRequestPaused(request)

      await tick()
      await onRequestPaused(response)
      await handled

      expect(client.send).to.have.been.calledWith('Fetch.continueResponse', {
        requestId: 'fetch-request',
        responseCode: 200,
      })
    })

    // `toResponseHeaders({})` returns `[]`, which is truthy, so `headers = {}`
    // must keep meaning "delete all headers" and not be mistaken for "headers
    // untouched" by a future refactor.
    it('sends only the pause wire-encoding headers when middleware clears headers on a continued response', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const { transport } = createTransport(client, { httpIntercept })
      const request = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1' })
      const response = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1', responseStatusCode: 200 })

      response.responseHeaders = [
        { name: 'Content-Encoding', value: 'gzip' },
        { name: 'Content-Type', value: 'text/html' },
      ]

      httpIntercept.use(async (req, next) => {
        const res = await next(req)

        return { ...res, headers: {} }
      })

      const onRequestPaused = await startTransport(transport, client)
      const handled = onRequestPaused(request)

      await tick()
      await onRequestPaused(response)
      await handled

      expect(client.send).to.have.been.calledWith('Fetch.continueResponse', {
        requestId: 'fetch-request',
        responseCode: 200,
        responseHeaders: [{
          name: 'Content-Encoding',
          value: 'gzip',
        }],
      })
    })

    it('sends an empty responseHeaders array when middleware clears headers on a fulfilled response', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const { transport } = createTransport(client, { httpIntercept })

      client.send.withArgs('Fetch.getResponseBody').resolves({
        body: Buffer.from('origin').toString('base64'),
        base64Encoded: true,
      })

      httpIntercept.use(async (req, next) => {
        const response = await next(req)

        return {
          ...response,
          body: 'mutated',
          headers: {},
        }
      })

      const onRequestPaused = await startTransport(transport, client)
      const handled = onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
      }))

      await tick()

      await onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
        responseStatusCode: 200,
      }))

      await handled

      expect(client.send).to.have.been.calledWith('Fetch.fulfillRequest', {
        requestId: 'fetch-request',
        responseCode: 200,
        responsePhrase: 'OK',
        responseHeaders: [],
        body: Buffer.from('mutated').toString('base64'),
      })
    })
  })

  describe('browser request cancellation', () => {
    // Parks a flow in the middleware onion the way pre-request correlation
    // does, so the cancellation arrives while the request pause is still held.
    function parkedIntercept () {
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const parked = Promise.withResolvers<any>()

      httpIntercept.use(async () => parked.promise)

      return { httpIntercept, parked }
    }

    it('aborts a flow still paused in the middleware onion', async () => {
      const client = createClient()
      const { httpIntercept, parked } = parkedIntercept()
      const onRequestCanceled = sinon.stub().callsFake(() => {
        parked.reject(new Error('request destroyed before browser pre-request was received'))
      })

      const { transport } = createTransport(client, { httpIntercept, onRequestCanceled })
      const onRequestPaused = await startTransport(transport, client)
      const handled = onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
      }))

      await tick()

      expect(client.send).not.to.have.been.calledWith('Fetch.continueRequest')

      onLoadingFailed(client, { requestId: 'network-1', canceled: true })

      await handled

      expect(onRequestCanceled).to.have.been.calledOnceWith('network-1')
      // the pause is released rather than left held; the request is already
      // gone, so CDP rejecting this is expected and swallowed
      expect(client.send).to.have.been.calledWith('Fetch.continueRequest', {
        requestId: 'fetch-request',
      })
    })

    it('does not strand a continueResponse when the cancellation lands after the request was continued', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const { transport } = createTransport(client, { httpIntercept })
      const onRequestPaused = await startTransport(transport, client)
      const handled = onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
      }))

      await tick()

      expect(client.send).to.have.been.calledWith('Fetch.continueRequest', {
        requestId: 'fetch-request',
      })

      onLoadingFailed(client, { requestId: 'network-1', canceled: true })

      await handled

      // no response pause ever arrived for this flow, so there is no pause left
      // to release — sending one would target a request id CDP no longer knows
      expect(client.send).not.to.have.been.calledWith('Fetch.continueResponse')
      expect(client.send).not.to.have.been.calledWith('Fetch.fulfillRequest')
    })

    it('leaves a genuine network failure to the response error pause', async () => {
      const client = createClient()
      const { httpIntercept, parked } = parkedIntercept()
      const onRequestCanceled = sinon.stub()
      const { transport } = createTransport(client, { httpIntercept, onRequestCanceled })
      const onRequestPaused = await startTransport(transport, client)

      onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
      }))

      await tick()

      onLoadingFailed(client, { requestId: 'network-1', canceled: false, errorText: 'net::ERR_CONNECTION_REFUSED' })

      expect(onRequestCanceled).not.to.have.been.called

      parked.reject(new Error('unparked'))
      await tick()
    })

    it('ignores a cancellation for a request it never paused', async () => {
      const client = createClient()
      const onRequestCanceled = sinon.stub()
      const { transport } = createTransport(client, { onRequestCanceled })

      await startTransport(transport, client)

      onLoadingFailed(client, { requestId: 'never-paused', canceled: true })

      expect(onRequestCanceled).not.to.have.been.called
    })

    it('scopes cancellation to the session the request paused on', async () => {
      const client = createClient()
      const { httpIntercept, parked } = parkedIntercept()
      const onRequestCanceled = sinon.stub()
      const { transport } = createTransport(client, { httpIntercept, onRequestCanceled })
      const onRequestPaused = await startTransport(transport, client)

      onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
      }), 'service-worker-session')

      await tick()

      // CDP request ids are only unique per session
      onLoadingFailed(client, { requestId: 'network-1', canceled: true })

      expect(onRequestCanceled).not.to.have.been.called

      onLoadingFailed(client, { requestId: 'network-1', canceled: true }, 'service-worker-session')

      expect(onRequestCanceled).to.have.been.calledOnceWith('network-1')

      parked.reject(new Error('unparked'))
      await tick()
    })

    it('namespaces the canceled request id for an extra-target transport', async () => {
      const client = createClient()
      const { httpIntercept, parked } = parkedIntercept()
      const onRequestCanceled = sinon.stub()
      const { transport } = createTransport(client, { httpIntercept, onRequestCanceled, isFromExtraTarget: true })
      const onRequestPaused = await startTransport(transport, client)

      onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
      }))

      await tick()

      onLoadingFailed(client, { requestId: 'network-1', canceled: true })

      // must match the id the shared HttpIntercept was handed
      expect(onRequestCanceled.firstCall.args[0]).to.match(/^extra-\d+:network-1$/)

      parked.reject(new Error('unparked'))
      await tick()
    })

    it('stops cancelling once the flow has completed', async () => {
      const client = createClient()
      const onRequestCanceled = sinon.stub()
      const { transport } = createTransport(client, { onRequestCanceled })
      const onRequestPaused = await startTransport(transport, client)
      const handled = onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
      }))

      await tick()

      await onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
        responseStatusCode: 200,
      }))

      await handled

      onLoadingFailed(client, { requestId: 'network-1', canceled: true })

      expect(onRequestCanceled).not.to.have.been.called
    })

    it('unsubscribes from Network.loadingFailed on stop', async () => {
      const client = createClient()
      const { transport } = createTransport(client)

      await transport.start()
      await transport.stop()

      expect(client.off).to.have.been.calledWith('Network.loadingFailed')
    })
  })
})
