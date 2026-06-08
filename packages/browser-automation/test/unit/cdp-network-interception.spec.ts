import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ForNetworkInterception, HttpResponse } from '@packages/network-interception'
import { CDPNetworkInterception } from '../../lib/cdp/cdp-network-interception'
import { createFetchPausedEvent, FakeCriClient } from '../../lib/testing/fake-cri-client'

describe('CDPNetworkInterception', () => {
  let client: FakeCriClient
  let handle: ReturnType<typeof vi.fn<ForNetworkInterception['handle']>>
  let interception: CDPNetworkInterception

  beforeEach(() => {
    client = new FakeCriClient()
    handle = vi.fn<ForNetworkInterception['handle']>()
    interception = new CDPNetworkInterception(
      { handle },
      () => client,
    )
  })

  it('continues unmatched requests without fulfilling', async () => {
    handle.mockImplementation(async (request, next) => {
      return next(request)
    })

    await interception.enable()
    client.emit('Fetch.requestPaused', createFetchPausedEvent())

    await vi.waitFor(() => {
      expect(client.getCommands('Fetch.continueRequest')).toHaveLength(1)
    })

    expect(handle).toHaveBeenCalledOnce()
    expect(client.getCommands('Fetch.fulfillRequest')).toHaveLength(0)
    expect(client.getLastCommand('Fetch.continueRequest')?.params).toEqual({
      requestId: 'req-1',
      url: 'https://example.com/',
      method: 'GET',
      headers: [{ name: 'accept', value: 'text/html' }],
    })
  })

  it('fulfills request-stage static stubs without continuing', async () => {
    const stubResponse: HttpResponse = {
      statusCode: 201,
      statusMessage: 'Created',
      headers: { 'content-type': 'text/plain' },
      body: 'stubbed',
    }

    handle.mockResolvedValue(stubResponse)

    await interception.enable()
    client.emit('Fetch.requestPaused', createFetchPausedEvent())

    await vi.waitFor(() => {
      expect(client.getCommands('Fetch.fulfillRequest')).toHaveLength(1)
    })

    expect(client.getCommands('Fetch.continueRequest')).toHaveLength(0)
    expect(client.getLastCommand('Fetch.fulfillRequest')?.params).toMatchObject({
      requestId: 'req-1',
      responseCode: 201,
      responsePhrase: 'Created',
      body: Buffer.from('stubbed').toString('base64'),
    })
  })

  it('continues with merged headers when handle calls next with mutations', async () => {
    handle.mockImplementation(async (_request, next) => {
      return next({
        inFlightInterceptId: 'x',
        browserRequestId: 'req-1',
        url: 'https://example.com/changed',
        method: 'PUT',
        headers: { 'x-test': '1' },
        body: 'payload',
      })
    })

    await interception.enable()
    client.emit('Fetch.requestPaused', createFetchPausedEvent())

    await vi.waitFor(() => {
      expect(client.getCommands('Fetch.continueRequest')).toHaveLength(1)
    })

    expect(client.getLastCommand('Fetch.continueRequest')?.params).toEqual({
      requestId: 'req-1',
      url: 'https://example.com/changed',
      method: 'PUT',
      headers: [{ name: 'x-test', value: '1' }],
      postData: 'payload',
    })
  })

  it('fulfills CORS preflight responses', async () => {
    handle.mockResolvedValue({
      statusCode: 204,
      headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET, POST',
      },
      body: '',
    })

    await interception.enable()
    client.emit('Fetch.requestPaused', createFetchPausedEvent({
      request: {
        url: 'https://example.com/api',
        method: 'OPTIONS',
        headers: {
          origin: 'https://example.com',
          'access-control-request-method': 'GET',
        },
        initialPriority: 'High',
        referrerPolicy: 'strict-origin-when-cross-origin',
      },
    }))

    await vi.waitFor(() => {
      expect(client.getCommands('Fetch.fulfillRequest')).toHaveLength(1)
    })

    expect(client.getLastCommand('Fetch.fulfillRequest')?.params).toMatchObject({
      responseCode: 204,
    })

    expect(client.getCommands('Fetch.continueRequest')).toHaveLength(0)
  })

  it('does not double-subscribe listeners on repeated enable', async () => {
    await interception.enable()
    await interception.enable()

    expect(client.getCommands('Fetch.enable')).toHaveLength(1)
    expect(client.queue.enableCommands).toHaveLength(1)

    const listenerCountBefore = client.listenerCount('Fetch.requestPaused')

    await interception.enable()

    const listenerCountAfter = client.listenerCount('Fetch.requestPaused')

    expect(listenerCountAfter).toBe(listenerCountBefore)
    expect(listenerCountAfter).toBe(1)
  })

  it('passes response-stage pauses through with continue', async () => {
    await interception.enable()
    client.emit('Fetch.requestPaused', createFetchPausedEvent({
      responseStatusCode: 200,
      responseHeaders: [{ name: 'content-type', value: 'text/html' }],
    }))

    await vi.waitFor(() => {
      expect(client.getCommands('Fetch.continueRequest')).toHaveLength(1)
    })

    expect(handle).not.toHaveBeenCalled()
  })

  it('fails the request when handle throws forceNetworkError', async () => {
    handle.mockRejectedValue(new Error('forceNetworkError'))

    await interception.enable()
    client.emit('Fetch.requestPaused', createFetchPausedEvent())

    await vi.waitFor(() => {
      expect(client.getCommands('Fetch.failRequest')).toHaveLength(1)
    })

    expect(client.getLastCommand('Fetch.failRequest')?.params).toEqual({
      requestId: 'req-1',
      errorReason: 'Failed',
    })
  })
})
