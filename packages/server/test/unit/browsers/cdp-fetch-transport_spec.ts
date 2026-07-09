const { expect, sinon } = require('../../spec_helper')

import type { Protocol } from 'devtools-protocol'
import { HttpIntercept } from '@packages/network-interception'
import { createCdpFetchCodec } from '../../../lib/browsers/cdp-protocol/cdp-fetch-codec'
import { CdpFetchTransport } from '../../../lib/browsers/cdp-protocol/cdp-fetch-transport'

function createPausedRequest (options: {
  requestId: string
  networkId?: string
  url?: string
  responseStatusCode?: number
  responseErrorReason?: Protocol.Network.ErrorReason
}): Protocol.Fetch.RequestPausedEvent {
  return {
    requestId: options.requestId,
    networkId: options.networkId,
    frameId: 'frame-1',
    resourceType: 'Document',
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

describe('CdpFetchTransport', () => {
  describe('createCdpFetchCodec', () => {
    it('decodes CDP request pauses to the minimal neutral request shape', () => {
      const codec = createCdpFetchCodec()
      const transportRequest = {
        id: 'network-1',
        url: 'https://example.test/',
        method: 'GET',
        headers: {},
      }

      const request = codec.decodeRequest(transportRequest)

      expect(request).to.deep.equal({
        id: 'network-1',
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

    it('round trips CDP response pauses through the minimal neutral response shape', () => {
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
      }

      codec.decodeRequest(transportRequest)

      const response = codec.decodeResponse(transportResponse)

      expect(response).to.deep.equal({
        id: 'network-1',
        url: 'https://example.test/',
      })

      const encoded = codec.encodeResponse({
        ...response,
        url: 'https://example.test/response',
      })

      expect(encoded.url).to.equal('https://example.test/response')
    })

    it('throws when encoding a response before a CDP response pause is decoded', () => {
      const codec = createCdpFetchCodec()
      const transportRequest = {
        id: 'network-1',
        url: 'https://example.test/',
        method: 'GET',
        headers: {},
      }

      codec.decodeRequest(transportRequest)

      expect(() => {
        codec.encodeResponse({
          id: 'network-1',
          url: 'https://example.test/',
        })
      }).to.throw('HttpIntercept middleware must call next() before returning a response')
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

    it('continues the request pause when middleware returns a response without calling next', async () => {
      const client = createClient()
      const httpIntercept = new HttpIntercept(createCdpFetchCodec())
      const transport = new CdpFetchTransport(client as any, httpIntercept)
      const onRequestPaused = await startTransport(transport, client)

      httpIntercept.use(async (req) => {
        return req
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

      expect(client.on).to.have.been.calledTwice
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

      expect(client.on).to.have.been.calledTwice
      expect(client.off).not.to.have.been.called
    })
  })
})
