const { expect, sinon } = require('../../spec_helper')

import type { Protocol } from 'devtools-protocol'
import { HttpIntercept } from '@packages/network-interception'
import { createCdpFetchCodec } from '../../../lib/browsers/cdp-fetch-codec'
import { CdpFetchTransport } from '../../../lib/browsers/cdp-fetch-transport'

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

async function tick () {
  for (let i = 0; i < 5; i++) {
    await Promise.resolve()
  }
}

async function startTransport (transport: CdpFetchTransport, client: ReturnType<typeof createClient>) {
  await transport.start()
  client.send.resetHistory()

  return (event: Protocol.Fetch.RequestPausedEvent, sessionId?: string) => {
    for (const call of client.on.withArgs('Fetch.requestPaused').getCalls()) {
      const handler = call.args[1] as (event: Protocol.Fetch.RequestPausedEvent, sessionId?: string) => void

      handler(event, sessionId)
    }
  }
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
  })

  describe('request pause handling', () => {
    it('continues the request and resolves the pending flow from a matching response pause', async () => {
      const client = createClient()
      const transport = new CdpFetchTransport(client as any)
      const request = createPausedRequest({ requestId: 'fetch-request', networkId: 'network-1' })
      const response = createPausedRequest({ requestId: 'fetch-response', networkId: 'network-1', responseStatusCode: 200 })
      const onRequestPaused = await startTransport(transport, client)

      onRequestPaused(request)

      await tick()

      expect(client.send).to.have.been.calledWith('Fetch.continueRequest', {
        requestId: 'fetch-request',
      })

      onRequestPaused(response)
      await tick()

      expect(client.send).to.have.been.calledWith('Fetch.fulfillRequest', {
        requestId: 'fetch-response',
        responseCode: 200,
      })
    })

    it('matches request and response pauses by network id', async () => {
      const client = createClient()
      const transport = new CdpFetchTransport(client as any)
      const onRequestPaused = await startTransport(transport, client)

      onRequestPaused(createPausedRequest({
        requestId: 'request-pause-id',
        networkId: 'shared-network-id',
      }))

      await tick()
      onRequestPaused(createPausedRequest({
        requestId: 'response-pause-id',
        networkId: 'shared-network-id',
        responseStatusCode: 200,
      }))

      await tick()

      expect(client.send).to.have.been.calledWith('Fetch.fulfillRequest', {
        requestId: 'response-pause-id',
        responseCode: 200,
      })
    })

    it('continues unmatched response pauses so the browser is not left paused', async () => {
      const client = createClient()
      const transport = new CdpFetchTransport(client as any)
      const onRequestPaused = await startTransport(transport, client)

      onRequestPaused(createPausedRequest({
        requestId: 'response-pause-id',
        responseStatusCode: 204,
      }))

      await tick()

      expect(client.send).to.have.been.calledOnceWith('Fetch.continueRequest', {
        requestId: 'response-pause-id',
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

      onRequestPaused(request)

      await tick()

      expect(client.send).to.have.been.calledWith('Fetch.continueRequest', {
        requestId: 'fetch-request',
        url: 'https://example.test/mutated',
      })

      onRequestPaused(response)
      await tick()
    })

    it('rejects the pending flow from a matching response failure pause', async () => {
      const client = createClient()
      const transport = new CdpFetchTransport(client as any)
      const onRequestPaused = await startTransport(transport, client)

      onRequestPaused(createPausedRequest({
        requestId: 'fetch-request',
        networkId: 'network-1',
      }))

      await tick()
      onRequestPaused(createPausedRequest({
        requestId: 'fetch-response',
        networkId: 'network-1',
        responseErrorReason: 'Aborted',
      }))

      await tick()

      expect(client.send).not.to.have.been.calledWith('Fetch.fulfillRequest')
    })
  })
})
