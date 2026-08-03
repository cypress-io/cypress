const { expect, sinon } = require('../../spec_helper')

import zlib from 'zlib'
import type { Protocol } from 'devtools-protocol'
import { HttpIntercept } from '@packages/network-interception'
import { createCdpFetchCodec } from '../../../lib/browsers/cdp-protocol/cdp-fetch-codec'
import { CdpFetchTransport } from '../../../lib/browsers/cdp-protocol/cdp-fetch-transport'

function createPausedRequest (options: {
  requestId: string
  networkId?: string
  url?: string
  resourceType?: Protocol.Network.ResourceType
  responseStatusCode?: number
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
    responseErrorReason: options.responseErrorReason,
  } as Protocol.Fetch.RequestPausedEvent
}

function createClient () {
  return {
    send: sinon.stub().resolves({}),
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
  addPendingUrlWithoutPreRequest?: (url: string) => void
} = {}) {
  const networkExtraInfo = createNetworkExtraInfo()
  const transport = new CdpFetchTransport(client as any, options.httpIntercept, {
    isAUTFrame: options.isAUTFrame,
    addPendingUrlWithoutPreRequest: options.addPendingUrlWithoutPreRequest,
  }, networkExtraInfo as any)

  return { transport, networkExtraInfo }
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

describe('CdpFetchTransport', () => {
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
        url: 'https://example.test/',
      })

      const encoded = codec.encodeResponse({
        ...response,
        url: 'https://example.test/response',
      })

      expect(encoded.url).to.equal('https://example.test/response')
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

      for (const [cdpType, expected] of [
        ['XHR', 'xhr'],
        ['Fetch', 'fetch'],
        ['Document', 'other'],
      ] as const) {
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

        expect(seenResourceTypes).to.include(expected)
      }
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
        responseHeaders: [{
          name: 'content-type',
          value: 'text/html',
        }],
        body: Buffer.from('plain').toString('base64'),
      })
    })

    it('normalizes pipeline re-encoded fulfilled bodies to identity', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const { transport } = createTransport(client, { httpIntercept })
      const request = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1' })
      const response = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1', responseStatusCode: 200 })
      const gzippedBody = zlib.gzipSync(Buffer.from('<html>compressed</html>'))

      // the legacy pipeline (CompressBody) may re-encode the outgoing body;
      // fulfillRequest delivers bodies as-is, so it must go out as identity
      httpIntercept.use(async (req, next) => {
        const res = await next(req)

        return {
          ...res,
          headers: {
            'content-type': 'text/html',
            'content-encoding': 'gzip',
            'content-length': '9999',
          },
          body: gzippedBody,
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
        responseHeaders: [{
          name: 'content-type',
          value: 'text/html',
        }],
        body: Buffer.from('<html>compressed</html>').toString('base64'),
      })
    })

    it('keeps the body and header pair when a fulfilled encoding cannot be decoded', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const { transport } = createTransport(client, { httpIntercept })
      const request = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1' })
      const response = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1', responseStatusCode: 200 })

      httpIntercept.use(async (req, next) => {
        const res = await next(req)

        return {
          ...res,
          headers: {
            'content-encoding': 'zstd',
          },
          body: Buffer.from('opaque-bytes'),
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
        responseHeaders: [{
          name: 'content-encoding',
          value: 'zstd',
        }],
        body: Buffer.from('opaque-bytes').toString('base64'),
      })
    })

    it('keeps wire encoding headers on pass-through continueResponse', async () => {
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
        responseHeaders: [{
          name: 'Content-Encoding',
          value: 'gzip',
        }, {
          name: 'Content-Type',
          value: 'text/html',
        }],
      })
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
      })
    })

    it('merges set-cookie from the Network extraInfo event into the response pause headers', async () => {
      const client = createClient()
      const { transport, networkExtraInfo } = createTransport(client)
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

      const onRequestPaused = await startTransport(transport, client)
      const handled = onRequestPaused(request, 'session-1')

      await tick()
      await onRequestPaused(response, 'session-1')
      await handled

      expect(networkExtraInfo.responseExtraInfo).to.have.been.calledOnceWith('network-1', 'session-1')

      expect(client.send).to.have.been.calledWith('Fetch.continueResponse', {
        requestId: 'fetch-request',
        responseCode: 200,
        responseHeaders: [{
          name: 'Content-Type',
          value: 'text/plain',
        }, {
          name: 'set-cookie',
          value: 'foo1=bar1; Domain=foobar.com',
        }, {
          name: 'set-cookie',
          value: 'foo2=bar2',
        }],
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

      expect(client.send).to.have.been.calledWith('Fetch.continueResponse', {
        requestId: 'fetch-request',
        responseCode: 200,
        responseHeaders: [{
          name: 'Content-Type',
          value: 'text/plain',
        }],
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

      expect(client.send).to.have.been.calledWith('Fetch.continueRequest', {
        requestId: 'fetch-request',
        method: 'POST',
        postData: 'payload',
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

      client.send.onCall(1).rejects(new Error('continueResponse failed'))
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
        responseHeaders: [{
          name: 'content-type',
          value: 'text/plain',
        }],
        body: Buffer.from('created').toString('base64'),
      })

      expect(client.send).not.to.have.been.calledWith('Fetch.continueResponse')
    })

    it('decompresses brotli response bodies before middleware reads them', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const { transport } = createTransport(client, { httpIntercept })
      const onRequestPaused = await startTransport(transport, client)

      client.send.withArgs('Fetch.getResponseBody').resolves({
        body: zlib.brotliCompressSync(Buffer.from('<html>origin</html>')).toString('base64'),
        base64Encoded: true,
      })

      let seenBody

      httpIntercept.use(async (req, next) => {
        const response = await next(req)

        seenBody = await readStream(response.bodyStream!)

        return {
          ...response,
          body: `${seenBody}-rewritten`,
        }
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

      response.responseHeaders = [
        { name: 'Content-Encoding', value: 'br' },
        { name: 'Content-Type', value: 'text/html' },
      ]

      await onRequestPaused(response)
      await handled

      expect(seenBody).to.equal('<html>origin</html>')

      expect(client.send).to.have.been.calledWith('Fetch.fulfillRequest', {
        requestId: 'fetch-request',
        responseCode: 200,
        responseHeaders: [{
          name: 'content-type',
          value: 'text/html',
        }],
        body: Buffer.from('<html>origin</html>-rewritten').toString('base64'),
      })
    })

    it('falls back to the delivered body when brotli decompression fails', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const { transport } = createTransport(client, { httpIntercept })
      const onRequestPaused = await startTransport(transport, client)

      // headers claim br but the body is already plaintext (e.g. a newer CDP
      // that decodes br itself)
      client.send.withArgs('Fetch.getResponseBody').resolves({
        body: Buffer.from('<html>already decoded</html>').toString('base64'),
        base64Encoded: true,
      })

      let seenBody

      httpIntercept.use(async (req, next) => {
        const response = await next(req)

        seenBody = await readStream(response.bodyStream!)

        return {
          ...response,
          body: seenBody,
        }
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

      response.responseHeaders = [
        { name: 'Content-Encoding', value: 'br' },
      ]

      await onRequestPaused(response)
      await handled

      expect(seenBody).to.equal('<html>already decoded</html>')
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
        responseHeaders: [{
          name: 'content-type',
          value: 'text/plain',
        }],
        body: Buffer.from('origin-rewritten').toString('base64'),
      })
    })

    it('fulfills rewritten empty response bodies without stalling', async () => {
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
          headers: {
            'content-type': 'text/plain',
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

      expect(client.send).to.have.been.calledWith('Fetch.fulfillRequest', {
        requestId: 'fetch-request',
        responseCode: 204,
        responseHeaders: [{
          name: 'content-type',
          value: 'text/plain',
        }],
        body: Buffer.from('').toString('base64'),
      })
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
      ])

      expect(networkExtraInfo.start).to.have.been.calledTwice
      expect(client.off).not.to.have.been.called
    })
  })
})
