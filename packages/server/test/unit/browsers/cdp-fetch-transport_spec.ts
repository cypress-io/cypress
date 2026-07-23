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
      })
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
        requestId: 'fetch-response',
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
      const transport = new CdpFetchTransport(client as any)
      const request = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1' })
      const response = createPausedRequest({ requestId: 'fetch-response', networkId: 'network-1', responseStatusCode: 200 })
      const onRequestPaused = await startTransport(transport, client)

      const handled = onRequestPaused(request)

      await tick()

      expect(client.send).to.have.been.calledWith('Fetch.continueRequest', {
        requestId: 'fetch-request',
      })

      await onRequestPaused(response)
      await handled

      expect(client.send).to.have.been.calledWith('Fetch.continueResponse', {
        requestId: 'fetch-response',
        responseCode: 200,
      })
    })

    it('marks AUT frame documents for the intercept pipeline without sending the header upstream', async () => {
      const client = createClient()
      const isAUTFrame = sinon.stub().withArgs('frame-1').resolves(true)
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const seenIsAutFrameHeader = sinon.stub()
      const transport = new CdpFetchTransport(client as any, httpIntercept, { isAUTFrame })
      const request = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1' })
      const response = createPausedRequest({ requestId: 'fetch-response', networkId: 'network-1', responseStatusCode: 200 })
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
      const transport = new CdpFetchTransport(client as any, undefined, { isAUTFrame })
      const request = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1', resourceType: 'XHR' })
      const response = createPausedRequest({ requestId: 'fetch-response', networkId: 'network-1', resourceType: 'XHR', responseStatusCode: 200 })
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

    it('strips a previously injected AUT frame header on redirect re-pause', async () => {
      const client = createClient()
      const isAUTFrame = sinon.stub().withArgs('frame-1').resolves(true)
      const transport = new CdpFetchTransport(client as any, undefined, { isAUTFrame })
      const request = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1' })
      const response = createPausedRequest({ requestId: 'fetch-response', networkId: 'network-1', responseStatusCode: 200 })
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
      const transport = new CdpFetchTransport(client as any, httpIntercept, { isAUTFrame })
      const request = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1' })
      const response = createPausedRequest({ requestId: 'fetch-response', networkId: 'network-1', responseStatusCode: 200 })
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
      const transport = new CdpFetchTransport(client as any, httpIntercept)
      const request = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1' })
      const response = createPausedRequest({ requestId: 'fetch-response', networkId: 'network-1', responseStatusCode: 200 })

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
        requestId: 'fetch-response',
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
      const transport = new CdpFetchTransport(client as any, httpIntercept)
      const request = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1' })
      const response = createPausedRequest({ requestId: 'fetch-response', networkId: 'network-1', responseStatusCode: 200 })
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
        requestId: 'fetch-response',
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
      const transport = new CdpFetchTransport(client as any, httpIntercept)
      const request = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1' })
      const response = createPausedRequest({ requestId: 'fetch-response', networkId: 'network-1', responseStatusCode: 200 })

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
        requestId: 'fetch-response',
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
      const transport = new CdpFetchTransport(client as any)
      const request = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1' })
      const response = createPausedRequest({ requestId: 'fetch-response', networkId: 'network-1', responseStatusCode: 200 })

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
        requestId: 'fetch-response',
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

    it('matches request and response pauses by network id', async () => {
      const client = createClient()
      const transport = new CdpFetchTransport(client as any)
      const onRequestPaused = await startTransport(transport, client)

      const handled = onRequestPaused(createPausedRequest({
        requestId: 'request-pause-id',
        networkId: 'shared-network-id',
      }))

      await tick()

      await onRequestPaused(createPausedRequest({
        requestId: 'response-pause-id',
        networkId: 'shared-network-id',
        responseStatusCode: 200,
      }))

      await handled

      expect(client.send).to.have.been.calledWith('Fetch.continueResponse', {
        requestId: 'response-pause-id',
        responseCode: 200,
      })
    })

    it('keeps concurrent requests isolated by network id', async () => {
      const client = createClient()
      const transport = new CdpFetchTransport(client as any)
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
        requestId: 'second-response-pause-id',
        networkId: 'second-network-id',
        responseStatusCode: 201,
      }))

      await onRequestPaused(createPausedRequest({
        requestId: 'first-response-pause-id',
        networkId: 'first-network-id',
        responseStatusCode: 200,
      }))

      await Promise.all([firstHandled, secondHandled])

      expect(client.send).to.have.been.calledWith('Fetch.continueResponse', {
        requestId: 'first-response-pause-id',
        responseCode: 200,
      })

      expect(client.send).to.have.been.calledWith('Fetch.continueResponse', {
        requestId: 'second-response-pause-id',
        responseCode: 201,
      })
    })

    it('does not let a timed out redirect hop reject a newer flow with the same network id', async () => {
      const clock = sinon.useFakeTimers()
      const client = createClient()
      const transport = new CdpFetchTransport(client as any)
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

      // buffer extraInfo so the set-cookie merge resolves without its bounded
      // wait, which would collide with the second flow's response timeout on
      // the fake clock
      const onExtraInfo = client.on.withArgs('Network.responseReceivedExtraInfo').firstCall.args[1]

      onExtraInfo({
        requestId: 'shared-network-id',
        headers: {},
      })

      await onRequestPaused(createPausedRequest({
        requestId: 'second-response-pause-id',
        networkId: 'shared-network-id',
        url: 'https://example.test/final',
        responseStatusCode: 200,
      }))

      await secondHandled

      expect(client.send).to.have.been.calledWith('Fetch.continueResponse', {
        requestId: 'second-response-pause-id',
        responseCode: 200,
      })
    })

    it('continues unmatched response pauses so the browser is not left paused', async () => {
      const client = createClient()
      const transport = new CdpFetchTransport(client as any)
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
      const transport = new CdpFetchTransport(client as any)
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
      const transport = new CdpFetchTransport(client as any)
      const onRequestPaused = await startTransport(transport, client)

      const handled = onRequestPaused(createPausedRequest({
        requestId: 'request-pause-id',
        networkId: 'shared-network-id',
      }))

      await tick()

      await onRequestPaused(createPausedRequest({
        requestId: 'response-pause-id',
        networkId: 'shared-network-id',
        responseStatusCode: 0,
      }))

      await handled

      expect(client.send).to.have.been.calledWith('Fetch.continueResponse', {
        requestId: 'response-pause-id',
        responseCode: 0,
      })
    })

    it('consumes a lone buffered extraInfo despite a status skew', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const transport = new CdpFetchTransport(client as any, httpIntercept)

      httpIntercept.use(async (req, next) => {
        const res = await next(req)

        return { ...res, body: 'ok' }
      })

      const onRequestPaused = await startTransport(transport, client)
      const onExtraInfo = client.on.withArgs('Network.responseReceivedExtraInfo').firstCall.args[1]

      // e.g. a revalidated response: the pause reports 200, the wire said 304
      onExtraInfo({
        requestId: 'network-1',
        statusCode: 304,
        headers: {
          'set-cookie': 'foo1=bar1',
        },
      })

      const handled = onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
      }))

      await tick()

      await onRequestPaused(createPausedRequest({
        requestId: 'fetch-response',
        networkId: 'network-1',
        responseStatusCode: 200,
      }))

      await handled

      expect(client.send).to.have.been.calledWith('Fetch.fulfillRequest', {
        requestId: 'fetch-response',
        responseCode: 200,
        responseHeaders: [{
          name: 'set-cookie',
          value: 'foo1=bar1',
        }],
        body: Buffer.from('ok').toString('base64'),
      })
    })

    it('falls back to a lone status-skewed extraInfo at the waiter timeout', async () => {
      const clock = sinon.useFakeTimers()
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const transport = new CdpFetchTransport(client as any, httpIntercept)

      httpIntercept.use(async (req, next) => {
        const res = await next(req)

        return { ...res, body: 'ok' }
      })

      const onRequestPaused = await startTransport(transport, client)
      const onRequestExtraInfo = client.on.withArgs('Network.requestWillBeSentExtraInfo').firstCall.args[1]
      const onExtraInfo = client.on.withArgs('Network.responseReceivedExtraInfo').firstCall.args[1]

      onRequestExtraInfo({
        requestId: 'network-1',
        headers: {},
      })

      const handled = onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
      }))

      await tick()

      const responseHandled = onRequestPaused(createPausedRequest({
        requestId: 'fetch-response',
        networkId: 'network-1',
        responseStatusCode: 200,
      }))

      await tick()

      // the skewed event buffers instead of satisfying the 200 waiter…
      onExtraInfo({
        requestId: 'network-1',
        statusCode: 304,
        headers: {
          'set-cookie': 'foo1=bar1',
        },
      })

      // …and the timeout picks it up rather than dropping the merge
      await clock.tickAsync(100)

      await responseHandled
      await handled

      expect(client.send).to.have.been.calledWith('Fetch.fulfillRequest', {
        requestId: 'fetch-response',
        responseCode: 200,
        responseHeaders: [{
          name: 'set-cookie',
          value: 'foo1=bar1',
        }],
        body: Buffer.from('ok').toString('base64'),
      })
    })

    it('keeps a later hop\'s extraInfo across the earlier hop\'s cleanup', async () => {
      const client = createClient()
      const transport = new CdpFetchTransport(client as any)
      const onRequestPaused = await startTransport(transport, client)
      const onExtraInfo = client.on.withArgs('Network.responseReceivedExtraInfo').firstCall.args[1]

      // hop 2's extraInfo can land between hop 1's continueResponse and its
      // cleanup — deliver it from inside the continueResponse send to pin
      // that ordering
      let hop2ExtraInfoDelivered = false

      client.send.callsFake(async (method: string, params: any) => {
        if (method === 'Fetch.continueResponse' && params.requestId === 'hop1-response' && !hop2ExtraInfoDelivered) {
          hop2ExtraInfoDelivered = true
          onExtraInfo({
            requestId: 'shared-network-id',
            statusCode: 200,
            headers: {
              'set-cookie': 'final=1',
            },
          })
        }

        return {}
      })

      // hop 1: the redirect
      const hop1 = onRequestPaused(createPausedRequest({
        requestId: 'hop1-request',
        networkId: 'shared-network-id',
      }))

      await tick()

      await onRequestPaused(createPausedRequest({
        requestId: 'hop1-response',
        networkId: 'shared-network-id',
        responseStatusCode: 302,
      }))

      await hop1

      // hop 2: the final document — its buffered extraInfo must have
      // survived hop 1's cleanup for the merge to see the Set-Cookie
      const hop2 = onRequestPaused(createPausedRequest({
        requestId: 'hop2-request',
        networkId: 'shared-network-id',
      }))

      await tick()

      await onRequestPaused(createPausedRequest({
        requestId: 'hop2-response',
        networkId: 'shared-network-id',
        responseStatusCode: 200,
      }))

      await hop2

      expect(client.send).to.have.been.calledWith('Fetch.continueResponse', sinon.match({
        requestId: 'hop2-response',
        responseHeaders: sinon.match((headers: { name: string, value: string }[]) => {
          return headers?.some(({ name, value }) => name === 'set-cookie' && value === 'final=1')
        }),
      }))
    })

    it('matches buffered extraInfo to the pause by status code across redirect hops', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const transport = new CdpFetchTransport(client as any, httpIntercept)

      httpIntercept.use(async (req, next) => {
        const res = await next(req)

        return { ...res, body: 'ok' }
      })

      const onRequestPaused = await startTransport(transport, client)
      const onExtraInfo = client.on.withArgs('Network.responseReceivedExtraInfo').firstCall.args[1]

      // Early Hints / a redirect hop buffered under the same request id must
      // not satisfy the final response's merge
      onExtraInfo({
        requestId: 'network-1',
        statusCode: 302,
        headers: {
          'set-cookie': 'hop=1',
        },
      })

      onExtraInfo({
        requestId: 'network-1',
        statusCode: 200,
        headers: {
          'set-cookie': 'final=1',
        },
      })

      const handled = onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
      }))

      await tick()

      await onRequestPaused(createPausedRequest({
        requestId: 'fetch-response',
        networkId: 'network-1',
        responseStatusCode: 200,
      }))

      await handled

      expect(client.send).to.have.been.calledWith('Fetch.fulfillRequest', {
        requestId: 'fetch-response',
        responseCode: 200,
        responseHeaders: [{
          name: 'set-cookie',
          value: 'final=1',
        }],
        body: Buffer.from('ok').toString('base64'),
      })
    })

    it('does not let a parked waiter accept a different hop’s extraInfo', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const transport = new CdpFetchTransport(client as any, httpIntercept)

      httpIntercept.use(async (req, next) => {
        const res = await next(req)

        return { ...res, body: 'ok' }
      })

      const onRequestPaused = await startTransport(transport, client)
      const onRequestExtraInfo = client.on.withArgs('Network.requestWillBeSentExtraInfo').firstCall.args[1]
      const onExtraInfo = client.on.withArgs('Network.responseReceivedExtraInfo').firstCall.args[1]

      onRequestExtraInfo({
        requestId: 'network-1',
        headers: {},
      })

      const handled = onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
      }))

      await tick()

      const responseHandled = onRequestPaused(createPausedRequest({
        requestId: 'fetch-response',
        networkId: 'network-1',
        responseStatusCode: 200,
      }))

      await tick()

      // an interim hop's event lands while the 200 pause is holding — it must
      // be buffered, not consumed by the waiter
      onExtraInfo({
        requestId: 'network-1',
        statusCode: 302,
        headers: {
          'set-cookie': 'hop=1',
        },
      })

      onExtraInfo({
        requestId: 'network-1',
        statusCode: 200,
        headers: {
          'set-cookie': 'final=1',
        },
      })

      await responseHandled
      await handled

      expect(client.send).to.have.been.calledWith('Fetch.fulfillRequest', {
        requestId: 'fetch-response',
        responseCode: 200,
        responseHeaders: [{
          name: 'set-cookie',
          value: 'final=1',
        }],
        body: Buffer.from('ok').toString('base64'),
      })
    })

    it('merges set-cookie from responseReceivedExtraInfo arriving before the response pause', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const transport = new CdpFetchTransport(client as any, httpIntercept)
      const request = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1' })
      const response = createPausedRequest({ requestId: 'fetch-response', networkId: 'network-1', responseStatusCode: 200 })

      response.responseHeaders = [{ name: 'Content-Type', value: 'text/plain' }]

      let seenResponseHeaders

      httpIntercept.use(async (req, next) => {
        const res = await next(req)

        seenResponseHeaders = { ...res.headers }

        return { ...res, body: 'ok' }
      })

      const onRequestPaused = await startTransport(transport, client)
      const onExtraInfo = client.on.withArgs('Network.responseReceivedExtraInfo').firstCall.args[1]

      onExtraInfo({
        requestId: 'network-1',
        headers: {
          'Set-Cookie': 'foo1=bar1; Domain=foobar.com\nfoo2=bar2',
        },
      })

      const handled = onRequestPaused(request)

      await tick()
      await onRequestPaused(response)
      await handled

      expect(seenResponseHeaders).to.deep.equal({
        'content-type': 'text/plain',
        'set-cookie': ['foo1=bar1; Domain=foobar.com', 'foo2=bar2'],
      })

      expect(client.send).to.have.been.calledWith('Fetch.fulfillRequest', {
        requestId: 'fetch-response',
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

    it('merges set-cookie from responseReceivedExtraInfo arriving after the response pause', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const transport = new CdpFetchTransport(client as any, httpIntercept)
      const request = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1' })
      const response = createPausedRequest({ requestId: 'fetch-response', networkId: 'network-1', responseStatusCode: 200 })

      httpIntercept.use(async (req, next) => {
        const res = await next(req)

        return { ...res, body: 'ok' }
      })

      const onRequestPaused = await startTransport(transport, client)
      const onRequestExtraInfo = client.on.withArgs('Network.requestWillBeSentExtraInfo').firstCall.args[1]
      const onExtraInfo = client.on.withArgs('Network.responseReceivedExtraInfo').firstCall.args[1]

      // request-side extraInfo marks the response-side one as expected,
      // so the pause waits for it instead of resolving immediately
      onRequestExtraInfo({
        requestId: 'network-1',
        headers: {},
      })

      const handled = onRequestPaused(request)

      await tick()

      const responseHandled = onRequestPaused(response)

      await tick()

      onExtraInfo({
        requestId: 'network-1',
        headers: {
          'set-cookie': 'foo1=bar1',
        },
      })

      await responseHandled
      await handled

      expect(client.send).to.have.been.calledWith('Fetch.fulfillRequest', {
        requestId: 'fetch-response',
        responseCode: 200,
        responseHeaders: [{
          name: 'set-cookie',
          value: 'foo1=bar1',
        }],
        body: Buffer.from('ok').toString('base64'),
      })
    })

    it('releases a parked extraInfo waiter when the flow is cleaned up mid-hold', async () => {
      const clock = sinon.useFakeTimers()
      const client = createClient()
      const transport = new CdpFetchTransport(client as any)
      const onRequestPaused = await startTransport(transport, client)
      const onRequestExtraInfo = client.on.withArgs('Network.requestWillBeSentExtraInfo').firstCall.args[1]

      const handled = onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
      }))

      await tick()

      // land the response pause inside the final 100ms of the response-pause
      // timeout so the flow's cleanup races the merge hold
      await clock.tickAsync(29950)

      onRequestExtraInfo({
        requestId: 'network-1',
        headers: {},
      })

      const responseHandled = onRequestPaused(createPausedRequest({
        requestId: 'fetch-response',
        networkId: 'network-1',
        responseStatusCode: 200,
      }))

      await tick()

      expect((transport as any).responseExtraInfoWaiters.size).to.equal(1)

      await clock.tickAsync(50)

      // the response-pause timeout cleaned the flow up; its parked waiter and
      // stale timer must not survive to delete a newer waiter later
      expect((transport as any).responseExtraInfoWaiters.size).to.equal(0)

      await handled
      await responseHandled

      expect(client.send).to.have.been.calledWith('Fetch.continueResponse', {
        requestId: 'fetch-response',
      })
    })

    it('releases the response pause when reset rejects the flow during the set-cookie merge', async () => {
      const client = createClient()
      const transport = new CdpFetchTransport(client as any)
      const onRequestPaused = await startTransport(transport, client)
      const onRequestExtraInfo = client.on.withArgs('Network.requestWillBeSentExtraInfo').firstCall.args[1]

      const handled = onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
      }))

      await tick()

      // mark extraInfo as expected so the response pause holds for the merge
      onRequestExtraInfo({
        requestId: 'network-1',
        headers: {},
      })

      const responseHandled = onRequestPaused(createPausedRequest({
        requestId: 'fetch-response',
        networkId: 'network-1',
        responseStatusCode: 200,
      }))

      await tick()

      transport.reset()

      await responseHandled
      await handled

      expect(client.send).to.have.been.calledWith('Fetch.continueResponse', {
        requestId: 'fetch-response',
      })
    })

    it('clears extraInfo tracking for flows that skip the merge wait', async () => {
      const client = createClient()
      const transport = new CdpFetchTransport(client as any)
      const onRequestPaused = await startTransport(transport, client)
      const onRequestExtraInfo = client.on.withArgs('Network.requestWillBeSentExtraInfo').firstCall.args[1]
      const onResponseReceived = client.on.withArgs('Network.responseReceived').firstCall.args[1]

      onRequestExtraInfo({
        requestId: 'network-1',
        headers: {},
      })

      onResponseReceived({
        requestId: 'network-1',
        hasExtraInfo: false,
      })

      const handled = onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
      }))

      await tick()

      await onRequestPaused(createPausedRequest({
        requestId: 'fetch-response',
        networkId: 'network-1',
        responseStatusCode: 200,
      }))

      await handled

      expect((transport as any).extraInfoExpected.size).to.equal(0)
      expect((transport as any).hasExtraInfoByRequest.size).to.equal(0)
      expect((transport as any).responseExtraInfos.size).to.equal(0)
    })

    it('clears extraInfo tracking when the flow ends in a response error pause', async () => {
      const client = createClient()
      const transport = new CdpFetchTransport(client as any)
      const onRequestPaused = await startTransport(transport, client)
      const onResponseReceived = client.on.withArgs('Network.responseReceived').firstCall.args[1]

      const handled = onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
      }))

      await tick()

      onResponseReceived({
        requestId: 'network-1',
        hasExtraInfo: true,
      })

      await onRequestPaused(createPausedRequest({
        requestId: 'fetch-response',
        networkId: 'network-1',
        responseErrorReason: 'Failed',
      }))

      await handled

      expect((transport as any).hasExtraInfoByRequest.size).to.equal(0)
      expect((transport as any).extraInfoExpected.size).to.equal(0)
    })

    it('does not merge extraInfo from a different session with a colliding request id', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const transport = new CdpFetchTransport(client as any, httpIntercept)

      httpIntercept.use(async (req, next) => {
        const res = await next(req)

        return { ...res, body: 'ok' }
      })

      const onRequestPaused = await startTransport(transport, client)
      const onExtraInfo = client.on.withArgs('Network.responseReceivedExtraInfo').firstCall.args[1]

      // a service-worker session reuses the page flow's request id
      onExtraInfo({
        requestId: 'network-1',
        headers: {
          'set-cookie': 'evil=1',
        },
      }, 'service-worker-session')

      const handled = onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
      }))

      await tick()

      await onRequestPaused(createPausedRequest({
        requestId: 'fetch-response',
        networkId: 'network-1',
        responseStatusCode: 200,
      }))

      await handled

      expect(client.send).to.have.been.calledWith('Fetch.fulfillRequest', {
        requestId: 'fetch-response',
        responseCode: 200,
        body: Buffer.from('ok').toString('base64'),
      })
    })

    it('clears extraInfo tracking for unmatched response pauses', async () => {
      const client = createClient()
      const transport = new CdpFetchTransport(client as any)
      const onRequestPaused = await startTransport(transport, client)
      const onResponseReceived = client.on.withArgs('Network.responseReceived').firstCall.args[1]
      const onExtraInfo = client.on.withArgs('Network.responseReceivedExtraInfo').firstCall.args[1]

      onResponseReceived({
        requestId: 'network-9',
        hasExtraInfo: true,
      })

      onExtraInfo({
        requestId: 'network-9',
        headers: {
          'set-cookie': 'stale=1',
        },
      })

      // no request pause ever registered this network id
      await onRequestPaused(createPausedRequest({
        requestId: 'unmatched-response',
        networkId: 'network-9',
        responseStatusCode: 200,
      }))

      expect(client.send).to.have.been.calledWith('Fetch.continueResponse', {
        requestId: 'unmatched-response',
      })

      expect((transport as any).hasExtraInfoByRequest.size).to.equal(0)
      expect((transport as any).responseExtraInfos.size).to.equal(0)
      expect((transport as any).extraInfoExpected.size).to.equal(0)
    })

    it('does not wait for extraInfo when responseReceived reports hasExtraInfo false', async () => {
      const client = createClient()
      const transport = new CdpFetchTransport(client as any)
      const request = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1' })
      const response = createPausedRequest({ requestId: 'fetch-response', networkId: 'network-1', responseStatusCode: 200 })
      const onRequestPaused = await startTransport(transport, client)
      const onRequestExtraInfo = client.on.withArgs('Network.requestWillBeSentExtraInfo').firstCall.args[1]
      const onResponseReceived = client.on.withArgs('Network.responseReceived').firstCall.args[1]

      // request-side extraInfo fired, but the authoritative flag says the
      // response-side one is not coming — the pause must not hold
      onRequestExtraInfo({
        requestId: 'network-1',
        headers: {},
      })

      onResponseReceived({
        requestId: 'network-1',
        hasExtraInfo: false,
      })

      const handled = onRequestPaused(request)

      await tick()
      await onRequestPaused(response)
      await handled

      expect(client.send).to.have.been.calledWith('Fetch.continueResponse', {
        requestId: 'fetch-response',
        responseCode: 200,
      })
    })

    it('sends a URL override when middleware mutates the neutral request URL', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const transport = new CdpFetchTransport(client as any, httpIntercept)
      const request = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1' })
      const response = createPausedRequest({ requestId: 'fetch-response', networkId: 'network-1', responseStatusCode: 200 })
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
      const transport = new CdpFetchTransport(client as any, httpIntercept)
      const request = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1' })
      const response = createPausedRequest({ requestId: 'fetch-response', networkId: 'network-1', responseStatusCode: 200 })
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
      const transport = new CdpFetchTransport(client as any, httpIntercept)
      const request = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1' })
      const response = createPausedRequest({ requestId: 'fetch-response', networkId: 'network-1', responseStatusCode: 200 })
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
      const transport = new CdpFetchTransport(client as any)
      const request = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1' })
      const response = createPausedRequest({ requestId: 'fetch-response', networkId: 'network-1', responseStatusCode: 200 })
      const onRequestPaused = await startTransport(transport, client)

      const handled = onRequestPaused(request)

      await tick()
      await onRequestPaused(response)
      await handled

      expect(client.send).to.have.been.calledWith('Fetch.continueResponse', {
        requestId: 'fetch-response',
        responseCode: 200,
      })

      expect(client.send).to.have.been.calledWith('Fetch.continueResponse', {
        requestId: 'fetch-response',
      })
    })

    it('continues the request pause when middleware fails before the terminal path', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const transport = new CdpFetchTransport(client as any, httpIntercept)
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
      const transport = new CdpFetchTransport(client as any, httpIntercept)
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
      const transport = new CdpFetchTransport(client as any, httpIntercept)
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
        requestId: 'fetch-response',
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
        requestId: 'fetch-response',
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
      const transport = new CdpFetchTransport(client as any, httpIntercept)
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
        requestId: 'fetch-response',
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
      const transport = new CdpFetchTransport(client as any, httpIntercept)
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
        requestId: 'fetch-response',
        networkId: 'network-1',
        responseStatusCode: 200,
      }))

      await handled

      expect(client.send).to.have.been.calledWith('Fetch.getResponseBody', {
        requestId: 'fetch-response',
      })

      expect(client.send).not.to.have.been.calledWith('Fetch.takeResponseBodyAsStream')

      expect(client.send).to.have.been.calledWith('Fetch.fulfillRequest', {
        requestId: 'fetch-response',
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
      const transport = new CdpFetchTransport(client as any, httpIntercept)
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
        requestId: 'fetch-response',
        networkId: 'network-1',
        responseStatusCode: 204,
      }))

      await handled

      expect(client.send).to.have.been.calledWith('Fetch.getResponseBody', {
        requestId: 'fetch-response',
      })

      expect(client.send).to.have.been.calledWith('Fetch.fulfillRequest', {
        requestId: 'fetch-response',
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
      const transport = new CdpFetchTransport(client as any)
      const onRequestPaused = await startTransport(transport, client)

      const handled = onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
      }))

      await tick()

      await onRequestPaused(createPausedRequest({
        requestId: 'fetch-response',
        networkId: 'network-1',
        responseErrorReason: 'Aborted',
      }))

      await handled

      expect(client.send).to.have.been.calledWith('Fetch.failRequest', {
        requestId: 'fetch-response',
        errorReason: 'Aborted',
      })

      expect(client.send).not.to.have.been.calledWith('Fetch.continueResponse')
    })

    it('rejects the pending flow when failing the response pause throws', async () => {
      const client = createClient()

      client.send.withArgs('Fetch.failRequest').rejects(new Error('failRequest failed'))
      const transport = new CdpFetchTransport(client as any)
      const onRequestPaused = await startTransport(transport, client)

      const handled = onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
      }))

      await tick()

      await onRequestPaused(createPausedRequest({
        requestId: 'fetch-response',
        networkId: 'network-1',
        responseErrorReason: 'Aborted',
      }))

      await handled

      expect(client.send).to.have.been.calledWith('Fetch.failRequest', {
        requestId: 'fetch-response',
        errorReason: 'Aborted',
      })
    })

    it('resolves the handler after stop rejects in-flight flows', async () => {
      const client = createClient()
      const transport = new CdpFetchTransport(client as any)
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
      const transport = new CdpFetchTransport(client as any, httpIntercept)

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
      const transport = new CdpFetchTransport(client as any)
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
        requestId: 'fetch-response-2',
        networkId: 'network-2',
        responseStatusCode: 200,
      }))

      await nextHandled
    })

    it('disables Fetch before removing handlers on stop', async () => {
      const client = createClient()
      const transport = new CdpFetchTransport(client as any)

      await transport.start()
      client.send.resetHistory()

      await transport.stop()

      expect(client.send).to.have.been.calledWith('Fetch.disable')
      expect(client.off).to.have.been.calledWith('Fetch.requestPaused')
    })

    it('does not register duplicate handlers on repeated start', async () => {
      const client = createClient()
      const transport = new CdpFetchTransport(client as any)

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
        'Network.requestWillBeSentExtraInfo',
        'Network.responseReceived',
        'Network.responseReceivedExtraInfo',
      ])
    })

    it('rolls back handlers when Fetch.enable fails so start can be retried', async () => {
      const client = createClient()

      client.send.onCall(0).rejects(new Error('enable failed'))
      const transport = new CdpFetchTransport(client as any)

      await expect(transport.start()).to.be.rejectedWith('enable failed')

      expect(client.off).to.have.been.calledWith('Fetch.requestPaused')

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
        'Network.requestWillBeSentExtraInfo',
        'Network.responseReceived',
        'Network.responseReceivedExtraInfo',
      ])

      expect(client.off).not.to.have.been.called
    })
  })
})
