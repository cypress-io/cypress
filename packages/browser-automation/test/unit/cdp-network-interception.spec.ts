import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { BackendRoute, ForInterceptionEvents, ForNetworkInterception, HttpResponse } from '@packages/network-interception'
import { HttpInterception, createTestWireMessages } from '@packages/network-interception'
import { CDPNetworkInterception } from '../../lib/cdp/cdp-network-interception'
import { createFetchPausedEvent, createFetchResponsePausedEvent, FakeCriClient } from '../../lib/testing/fake-cri-client'

describe('CDPNetworkInterception', () => {
  let client: FakeCriClient
  let handle: ReturnType<typeof vi.fn<ForNetworkInterception['handle']>>
  let interception: CDPNetworkInterception

  beforeEach(() => {
    client = new FakeCriClient()
    handle = vi.fn<ForNetworkInterception['handle']>()
    interception = new CDPNetworkInterception(
      { handle },
      client,
    )
  })

  it('forwards with interceptResponse and blocks until the response pause', async () => {
    handle.mockImplementation(async (request, next) => {
      return next(request)
    })

    await interception.enable()
    client.emit('Fetch.requestPaused', createFetchPausedEvent())

    await vi.waitFor(() => {
      expect(client.getCommands('Fetch.continueRequest')).toHaveLength(1)
    })

    expect(handle).toHaveBeenCalledOnce()
    // handle() is still blocked on next() until the response-stage pause arrives.
    expect(client.getCommands('Fetch.fulfillRequest')).toHaveLength(0)
    expect(client.getLastCommand('Fetch.continueRequest')?.params).toEqual({
      requestId: 'req-1',
      url: 'https://example.com/',
      method: 'GET',
      headers: [{ name: 'accept', value: 'text/html' }],
      interceptResponse: true,
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
      interceptResponse: true,
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

  it('passes a response-stage pause with no pending forward through via continueResponse', async () => {
    await interception.enable()
    client.emit('Fetch.requestPaused', createFetchResponsePausedEvent())

    await vi.waitFor(() => {
      expect(client.getCommands('Fetch.continueResponse')).toHaveLength(1)
    })

    expect(handle).not.toHaveBeenCalled()
    expect(client.getCommands('Fetch.continueRequest')).toHaveLength(0)
    expect(client.getLastCommand('Fetch.continueResponse')?.params).toEqual({
      requestId: 'req-1',
    })
  })

  it('materializes the origin response and fulfills on the forward path', async () => {
    handle.mockImplementation(async (request, next) => next(request))

    client.setResponseBody('req-1', 'origin-body')

    await interception.enable()
    client.emit('Fetch.requestPaused', createFetchPausedEvent())

    await vi.waitFor(() => {
      expect(client.getCommands('Fetch.continueRequest')).toHaveLength(1)
    })

    client.emit('Fetch.requestPaused', createFetchResponsePausedEvent())

    await vi.waitFor(() => {
      expect(client.getCommands('Fetch.fulfillRequest')).toHaveLength(1)
    })

    expect(client.getCommands('Fetch.getResponseBody')).toHaveLength(1)
    expect(client.getLastCommand('Fetch.getResponseBody')?.params).toEqual({ requestId: 'req-1' })
    expect(client.getLastCommand('Fetch.fulfillRequest')?.params).toMatchObject({
      requestId: 'req-1',
      responseCode: 200,
      body: Buffer.from('origin-body').toString('base64'),
    })
  })

  it('fulfills with the modified response when handle mutates the origin response', async () => {
    handle.mockImplementation(async (request, next) => {
      const origin = await next(request)

      return { ...origin, statusCode: 418, body: 'teapot' }
    })

    client.setResponseBody('req-1', 'origin-body')

    await interception.enable()
    client.emit('Fetch.requestPaused', createFetchPausedEvent())

    await vi.waitFor(() => {
      expect(client.getCommands('Fetch.continueRequest')).toHaveLength(1)
    })

    client.emit('Fetch.requestPaused', createFetchResponsePausedEvent())

    await vi.waitFor(() => {
      expect(client.getCommands('Fetch.fulfillRequest')).toHaveLength(1)
    })

    expect(client.getLastCommand('Fetch.fulfillRequest')?.params).toMatchObject({
      requestId: 'req-1',
      responseCode: 418,
      body: Buffer.from('teapot').toString('base64'),
    })
  })

  it('fails the request when the origin response is a network error', async () => {
    handle.mockImplementation(async (request, next) => next(request))

    await interception.enable()
    client.emit('Fetch.requestPaused', createFetchPausedEvent())

    await vi.waitFor(() => {
      expect(client.getCommands('Fetch.continueRequest')).toHaveLength(1)
    })

    client.emit('Fetch.requestPaused', createFetchPausedEvent({
      responseErrorReason: 'ConnectionFailed',
    }))

    await vi.waitFor(() => {
      expect(client.getCommands('Fetch.failRequest')).toHaveLength(1)
    })

    expect(client.getCommands('Fetch.getResponseBody')).toHaveLength(0)
    // The origin's CDP error reason is forwarded verbatim rather than flattened to 'Failed'.
    expect(client.getLastCommand('Fetch.failRequest')?.params).toEqual({
      requestId: 'req-1',
      errorReason: 'ConnectionFailed',
    })
  })

  it('rejects in-flight forwards on disable', async () => {
    let nextRejected = false

    handle.mockImplementation(async (request, next) => {
      try {
        return await next(request)
      } catch (err) {
        nextRejected = true
        throw err
      }
    })

    await interception.enable()
    client.emit('Fetch.requestPaused', createFetchPausedEvent())

    await vi.waitFor(() => {
      expect(client.getCommands('Fetch.continueRequest')).toHaveLength(1)
    })

    await interception.disable()

    await vi.waitFor(() => {
      expect(nextRejected).toBe(true)
    })

    // A subsequent response-stage pause for the same id is treated as having no pending forward.
    await interception.enable()
    client.emit('Fetch.requestPaused', createFetchResponsePausedEvent())

    await vi.waitFor(() => {
      expect(client.getCommands('Fetch.continueResponse')).toHaveLength(1)
    })
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

describe('CDPNetworkInterception with real HttpInterception', () => {
  it('runs response-stage subscriptions when the adapter drives next()', async () => {
    const emit = vi.fn()
    const emitAndAwait = vi.fn(async () => ({}))
    const interceptionEvents: ForInterceptionEvents = {
      emit,
      emitAndAwait,
      resolveEventHandler: vi.fn(),
    }

    const route: BackendRoute = {
      id: 'route-1',
      hasInterceptor: true,
      routeMatcher: { url: '*' },
      getFixture: async () => '',
      matches: 0,
    }

    const realInterception = new HttpInterception({
      getRoutes: () => [route],
      interceptionEvents,
      wireMessages: createTestWireMessages(),
    })

    const client = new FakeCriClient()

    client.setResponseBody('req-1', 'origin-body')

    const interception = new CDPNetworkInterception(realInterception, client)

    await interception.enable()
    client.emit('Fetch.requestPaused', createFetchPausedEvent())

    await vi.waitFor(() => {
      expect(client.getCommands('Fetch.continueRequest')).toHaveLength(1)
    })

    client.emit('Fetch.requestPaused', createFetchResponsePausedEvent())

    await vi.waitFor(() => {
      expect(client.getCommands('Fetch.fulfillRequest')).toHaveLength(1)
    })

    expect(emitAndAwait).toHaveBeenCalledWith('before:request', expect.objectContaining({
      browserRequestId: 'req-1',
    }))

    const emittedEvents = emit.mock.calls.map(([eventName]) => eventName)

    expect(emittedEvents).toContain('response:callback')
    expect(emittedEvents).toContain('after:response')

    expect(client.getLastCommand('Fetch.fulfillRequest')?.params).toMatchObject({
      requestId: 'req-1',
      responseCode: 200,
      body: Buffer.from('origin-body').toString('base64'),
    })
  })
})
