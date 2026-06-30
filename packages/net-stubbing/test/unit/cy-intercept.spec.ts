import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PassThrough } from 'stream'
import errors from '@packages/errors'
import { HttpIntercept } from '@packages/network-interception'
import type { BackendRoute } from '@packages/network-interception'
import { CyIntercept, _restoreMatcherOptionsTypes } from '../../lib/cy-intercept'

describe('CyIntercept', () => {
  const getFixture = vi.fn(async () => '')
  const socket = { toDriver: vi.fn() }

  const createStack = (options: {
    routes?: BackendRoute[]
    cyIntercept?: CyIntercept
  } = {}) => {
    const cyIntercept = options.cyIntercept ?? new CyIntercept({ socket })
    const httpIntercept = new HttpIntercept()

    if (options.routes) {
      cyIntercept.routes.push(...options.routes)
    }

    httpIntercept.use(cyIntercept.middleware)

    return { cyIntercept, httpIntercept }
  }

  beforeEach(() => {
    getFixture.mockClear()
    socket.toDriver.mockClear()
  })

  it('calls next when no routes match', async () => {
    const { httpIntercept } = createStack()
    const next = vi.fn(async () => {
      return {
        statusCode: 200,
        headers: {},
        body: 'origin',
      }
    })

    const response = await httpIntercept.handle({
      inFlightInterceptId: 'intercept-1',
      url: 'http://example.com/',
      method: 'GET',
      headers: {},
    }, next)

    expect(next).toHaveBeenCalledOnce()
    expect(response.body).toBe('origin')
  })

  it('returns preflight response without calling next', async () => {
    const { httpIntercept } = createStack({
      routes: [{
        id: 'route-1',
        hasInterceptor: true,
        routeMatcher: { url: '*' },
        getFixture,
        matches: 0,
      }],
    })
    const next = vi.fn()

    const response = await httpIntercept.handle({
      inFlightInterceptId: 'intercept-1',
      url: 'http://example.com/',
      method: 'OPTIONS',
      headers: {
        origin: 'http://example.com',
        'access-control-request-method': 'GET',
      },
    }, next)

    expect(next).not.toHaveBeenCalled()
    expect(response.statusCode).toBe(204)
  })

  it('returns static stub at request stage without calling next', async () => {
    const { httpIntercept } = createStack({
      routes: [{
        id: 'route-1',
        hasInterceptor: false,
        routeMatcher: { url: 'http://example.com/*' },
        getFixture,
        matches: 0,
        staticResponse: {
          statusCode: 201,
          body: 'stubbed',
        },
      }],
    })
    const next = vi.fn()

    const response = await httpIntercept.handle({
      inFlightInterceptId: 'intercept-1',
      url: 'http://example.com/foo',
      method: 'GET',
      headers: {},
    }, next)

    expect(next).not.toHaveBeenCalled()
    expect(response.statusCode).toBe(201)
    expect(response.body).toBe('stubbed')
  })

  it('emits response:callback with url for request-stage static stubs', async () => {
    const cyIntercept = new CyIntercept({ socket })
    const emit = vi.spyOn(cyIntercept, 'emit')

    const { httpIntercept } = createStack({
      routes: [{
        id: 'route-1',
        hasInterceptor: false,
        routeMatcher: { url: 'http://example.com/*' },
        getFixture,
        matches: 0,
        staticResponse: {
          statusCode: 201,
          body: 'stubbed',
        },
      }],
      cyIntercept,
    })

    await httpIntercept.handle({
      inFlightInterceptId: 'intercept-1',
      url: 'http://example.com/foo',
      method: 'GET',
      headers: {},
    }, vi.fn())

    const callbackEmit = emit.mock.calls.find(([eventName]) => eventName === 'response:callback')

    expect(callbackEmit).toBeDefined()
    expect(callbackEmit![1].data).toMatchObject({
      url: 'http://example.com/foo',
      body: 'stubbed',
      statusCode: 201,
    })
  })

  it('emits response:callback with request body for static stub routes without interceptors', async () => {
    const cyIntercept = new CyIntercept({ socket })
    const emit = vi.spyOn(cyIntercept, 'emit')

    const { httpIntercept } = createStack({
      routes: [{
        id: 'route-1',
        hasInterceptor: false,
        routeMatcher: { url: '/users', method: 'POST' },
        getFixture,
        matches: 0,
        staticResponse: {
          statusCode: 201,
          body: { name: 'b' },
        },
      }],
      cyIntercept,
    })

    await httpIntercept.handle({
      inFlightInterceptId: 'intercept-1',
      url: 'http://example.com/users',
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      materializeRequestBody: async () => Buffer.from('{"some":"data"}'),
    }, vi.fn())

    const beforeRequestEmit = emit.mock.calls.find(([eventName]) => eventName === 'before:request')

    expect(beforeRequestEmit).toBeDefined()
    expect(beforeRequestEmit![1].data).toMatchObject({
      body: '{"some":"data"}',
      method: 'POST',
    })
  })

  it('emits response:callback with origin body for alias-only intercepts (react users scenario)', async () => {
    const cyIntercept = new CyIntercept({ socket })
    const emit = vi.spyOn(cyIntercept, 'emit')

    const requestUrl = 'https://jsonplaceholder.typicode.com/users?_limit=3'
    const users = [
      { id: 1, name: 'Leanne Graham', username: 'Bret', email: 'Sincere@april.biz' },
      { id: 2, name: 'Ervin Howell', username: 'Antonette', email: 'Shanna@melissa.tv' },
      { id: 3, name: 'Clementine Bauch', username: 'Samantha', email: 'Nathan@yesenia.net' },
    ]
    const usersJson = JSON.stringify(users)

    const { httpIntercept } = createStack({
      routes: [{
        id: 'route-1',
        hasInterceptor: false,
        routeMatcher: { url: '/users?_limit=3' },
        getFixture,
        matches: 0,
      }],
      cyIntercept,
    })

    const next = vi.fn(async (request) => {
      expect(request.materializeOriginResponse).toBe(true)

      return {
        statusCode: 200,
        headers: { 'content-type': 'application/json; charset=utf-8' },
        body: usersJson,
      }
    })

    const response = await httpIntercept.handle({
      inFlightInterceptId: 'intercept-1',
      url: requestUrl,
      method: 'GET',
      headers: {},
    }, next)

    expect(next).toHaveBeenCalledOnce()
    expect(response.body).toBe(usersJson)

    const callbackEmit = emit.mock.calls.find(([eventName]) => eventName === 'response:callback')

    expect(callbackEmit).toBeDefined()
    expect(callbackEmit![1].data).toMatchObject({
      url: requestUrl,
      body: usersJson,
      statusCode: 200,
    })

    expect(JSON.parse(callbackEmit![1].data.body as string)).toHaveLength(3)
  })

  it('emits response:callback with origin JSON when next returns stream-only (proxy passthrough regression)', async () => {
    const cyIntercept = new CyIntercept({ socket })
    const emit = vi.spyOn(cyIntercept, 'emit')

    const requestUrl = 'https://jsonplaceholder.typicode.com/users?_limit=3'
    const usersJson = JSON.stringify([
      { id: 1, name: 'Leanne Graham' },
      { id: 2, name: 'Ervin Howell' },
      { id: 3, name: 'Clementine Bauch' },
    ])

    const { httpIntercept } = createStack({
      routes: [{
        id: 'route-1',
        hasInterceptor: false,
        routeMatcher: { url: '/users?_limit=3' },
        getFixture,
        matches: 0,
      }],
      cyIntercept,
    })

    // Simulates createFetchOrigin when materializeOriginResponse was not honored.
    const next = vi.fn(async (request) => {
      expect(request.materializeOriginResponse).toBe(true)

      const stream = new PassThrough()

      stream.end(usersJson)

      return {
        statusCode: 200,
        headers: { 'content-type': 'application/json; charset=utf-8' },
        stream: async () => stream,
      }
    })

    await httpIntercept.handle({
      inFlightInterceptId: 'intercept-1',
      url: requestUrl,
      method: 'GET',
      headers: {},
    }, next)

    const callbackEmit = emit.mock.calls.find(([eventName]) => eventName === 'response:callback')

    expect(callbackEmit).toBeDefined()
    expect(callbackEmit![1].data).toMatchObject({
      url: requestUrl,
      body: usersJson,
      statusCode: 200,
    })

    expect(JSON.parse(callbackEmit![1].data.body as string)).toHaveLength(3)
  })

  it('merges request handler changes before calling next', async () => {
    const cyIntercept = new CyIntercept({ socket })
    const emitAndAwait = vi.spyOn(cyIntercept, 'emitAndAwait').mockImplementation(async () => {
      return {
        changedData: {
          url: 'http://example.com/foo',
          method: 'GET',
          headers: { 'x-test': 'changed' },
          body: '',
        },
      }
    })

    const { httpIntercept } = createStack({
      routes: [{
        id: 'route-1',
        hasInterceptor: true,
        routeMatcher: { url: 'http://example.com/*' },
        getFixture,
        matches: 0,
      }],
      cyIntercept,
    })

    const next = vi.fn(async (request) => {
      expect(request.headers['x-test']).toBe('changed')

      return {
        statusCode: 200,
        headers: {},
        body: 'origin',
      }
    })

    await httpIntercept.handle({
      inFlightInterceptId: 'intercept-1',
      url: 'http://example.com/foo',
      method: 'GET',
      headers: {},
    }, next)

    expect(next).toHaveBeenCalledOnce()
    expect(emitAndAwait).toHaveBeenCalled()
  })

  it('clones origin errors before emitting network:error to the driver', async () => {
    const cyIntercept = new CyIntercept({ socket })

    vi.spyOn(cyIntercept, 'emitAndAwait').mockResolvedValue({})
    const emit = vi.spyOn(cyIntercept, 'emit')
    const originError = Object.assign(new Error('connection reset'), { code: 'ECONNRESET' })

    const { httpIntercept } = createStack({
      routes: [{
        id: 'route-1',
        hasInterceptor: true,
        routeMatcher: { url: 'http://example.com/*' },
        getFixture,
        matches: 0,
      }],
      cyIntercept,
    })

    const next = vi.fn(async () => {
      throw originError
    })

    await expect(httpIntercept.handle({
      inFlightInterceptId: 'intercept-1',
      url: 'http://example.com/foo',
      method: 'GET',
      headers: {},
    }, next)).rejects.toThrow('connection reset')

    const networkErrorEmit = emit.mock.calls.find(([eventName]) => eventName === 'network:error')

    expect(networkErrorEmit).toBeDefined()
    expect(networkErrorEmit![1].data.error).toEqual(errors.cloneErr(originError))
  })

  it('resolves pending handler when forceNetworkError arrives during an in-flight event', async () => {
    const cyIntercept = new CyIntercept({ socket })
    const resolveEventHandler = vi.spyOn(cyIntercept, 'resolveEventHandler')

    const { httpIntercept } = createStack({
      routes: [{
        id: 'route-1',
        hasInterceptor: true,
        routeMatcher: { url: 'http://example.com/*' },
        getFixture,
        matches: 0,
      }],
      cyIntercept,
    })

    // The real emitAndAwait registers a pending handler and waits. Simulate the driver
    // sending forceNetworkError while the before:request emitAndAwait is suspended.
    vi.spyOn(cyIntercept, 'emitAndAwait').mockImplementation(async (eventName, frame: any) => {
      if (eventName === 'before:request') {
        // Register a fake pending handler so inFlightEventId is set
        const eventId = frame.eventId

        cyIntercept.pendingEventHandlers[eventId] = {
          eventName,
          complete: vi.fn(),
        }

        await cyIntercept.handleDriverEvent('send:static:response', {
          requestId: frame.requestId,
          staticResponse: { forceNetworkError: true },
        }, getFixture)
      }

      return {}
    })

    await expect(httpIntercept.handle({
      inFlightInterceptId: 'intercept-1',
      url: 'http://example.com/foo',
      method: 'GET',
      headers: {},
    }, vi.fn())).rejects.toThrow('forceNetworkError called')

    // resolveEventHandler must have been called to unblock the pending await
    expect(resolveEventHandler).toHaveBeenCalledWith(expect.objectContaining({ stopPropagation: true }))
  })

  it('emits network:error before forceNetworkError throw', async () => {
    const cyIntercept = new CyIntercept({ socket })
    const emit = vi.spyOn(cyIntercept, 'emit')

    const { httpIntercept } = createStack({
      routes: [{
        id: 'route-1',
        hasInterceptor: true,
        routeMatcher: { url: 'http://example.com/*' },
        getFixture,
        matches: 0,
      }],
      cyIntercept,
    })

    vi.spyOn(cyIntercept, 'emitAndAwait').mockImplementation(async (eventName) => {
      if (eventName === 'before:request') {
        await cyIntercept.handleDriverEvent('send:static:response', {
          requestId: 'intercept-1',
          staticResponse: { forceNetworkError: true },
        }, getFixture)
      }

      return {}
    })

    await expect(httpIntercept.handle({
      inFlightInterceptId: 'intercept-1',
      url: 'http://example.com/foo',
      method: 'GET',
      headers: {},
    }, vi.fn())).rejects.toThrow('forceNetworkError called')

    const networkErrorEmit = emit.mock.calls.find(([eventName]) => eventName === 'network:error')

    expect(networkErrorEmit).toBeDefined()
    expect(networkErrorEmit![1].data.error.message).toBe('forceNetworkError called')
  })

  it('emits network:error before forceNetworkError throw at response stage', async () => {
    const cyIntercept = new CyIntercept({ socket })
    const emit = vi.spyOn(cyIntercept, 'emit')

    const { httpIntercept } = createStack({
      routes: [{
        id: 'route-1',
        hasInterceptor: true,
        routeMatcher: { url: 'http://example.com/*' },
        getFixture,
        matches: 0,
      }],
      cyIntercept,
    })

    vi.spyOn(cyIntercept, 'emitAndAwait').mockImplementation(async (eventName) => {
      if (eventName === 'before:request') {
        await cyIntercept.handleDriverEvent('subscribe', {
          requestId: 'intercept-1',
          subscription: {
            routeId: 'route-1',
            eventName: 'response',
            await: true,
          },
        }, getFixture)

        return {}
      }

      if (eventName === 'response') {
        await cyIntercept.handleDriverEvent('send:static:response', {
          requestId: 'intercept-1',
          staticResponse: { forceNetworkError: true },
        }, getFixture)
      }

      return {}
    })

    await expect(httpIntercept.handle({
      inFlightInterceptId: 'intercept-1',
      url: 'http://example.com/foo',
      method: 'GET',
      headers: {},
    }, vi.fn(async () => {
      return {
        statusCode: 200,
        headers: {},
        body: 'origin',
      }
    }))).rejects.toThrow('forceNetworkError called')

    const networkErrorEmit = emit.mock.calls.find(([eventName]) => eventName === 'network:error')

    expect(networkErrorEmit).toBeDefined()
    expect(networkErrorEmit![1].data.error.message).toBe('forceNetworkError called')
  })

  it('resolves pending handler when send:static:response arrives at response stage', async () => {
    const cyIntercept = new CyIntercept({ socket })

    const { httpIntercept } = createStack({
      routes: [{
        id: 'route-1',
        hasInterceptor: true,
        routeMatcher: { url: 'http://example.com/*' },
        getFixture,
        matches: 0,
      }],
      cyIntercept,
    })

    vi.spyOn(cyIntercept, 'emitAndAwait').mockImplementation(async (eventName) => {
      if (eventName === 'before:request') {
        await cyIntercept.handleDriverEvent('subscribe', {
          requestId: 'intercept-1',
          subscription: {
            routeId: 'route-1',
            eventName: 'response',
            await: true,
          },
        }, getFixture)

        return {}
      }

      if (eventName === 'response') {
        await cyIntercept.handleDriverEvent('send:static:response', {
          requestId: 'intercept-1',
          staticResponse: {
            statusCode: 201,
            body: 'stubbed at response stage',
          },
        }, getFixture)
      }

      return {}
    })

    const response = await httpIntercept.handle({
      inFlightInterceptId: 'intercept-1',
      url: 'http://example.com/foo',
      method: 'GET',
      headers: {},
    }, vi.fn(async () => {
      return {
        statusCode: 200,
        headers: {},
        body: 'origin',
      }
    }))

    expect(response.statusCode).toBe(201)
    expect(response.body).toBe('stubbed at response stage')
  })

  it('response-stage res.send resolves via send:static:response without driver emitResolved', async () => {
    const cyIntercept = new CyIntercept({ socket })

    getFixture.mockResolvedValue(JSON.stringify({ foo: 1 }))

    const { httpIntercept } = createStack({
      routes: [{
        id: 'route-1',
        hasInterceptor: true,
        routeMatcher: { url: 'http://example.com/*' },
        getFixture,
        matches: 0,
      }],
      cyIntercept,
    })

    socket.toDriver.mockImplementation((_channel, eventName, frame: any) => {
      if (eventName === 'before:request') {
        void cyIntercept.handleDriverEvent('subscribe', {
          requestId: frame.requestId,
          subscription: {
            routeId: 'route-1',
            eventName: 'before:response',
            await: true,
            id: 'sub-1',
          },
        }, getFixture).then(() => {
          return cyIntercept.handleDriverEvent('event:handler:resolved', {
            eventId: frame.eventId,
            stopPropagation: false,
          })
        })
      }

      if (eventName === 'before:response') {
        void cyIntercept.handleDriverEvent('send:static:response', {
          requestId: frame.requestId,
          staticResponse: {
            statusCode: 200,
            headers: { 'content-type': 'application/json' },
            fixture: 'valid.json',
          },
        }, getFixture)
      }
    })

    const response = await httpIntercept.handle({
      inFlightInterceptId: 'intercept-1',
      url: 'http://example.com/foo',
      method: 'GET',
      headers: {},
    }, vi.fn(async () => {
      return {
        statusCode: 200,
        headers: {},
        body: 'origin',
      }
    }))

    expect(response.statusCode).toBe(200)
    expect(response.body).toBe(JSON.stringify({ foo: 1 }))
  })

  it('emitNetworkErrorByRequestId emits network:error for in-flight intercepts', async () => {
    const cyIntercept = new CyIntercept({ socket })
    const emit = vi.spyOn(cyIntercept, 'emit')

    vi.spyOn(cyIntercept, 'emitAndAwait').mockImplementation(async (eventName) => {
      if (eventName === 'before:request') {
        const proxyError = new Error('stream failed')

        await cyIntercept.emitNetworkErrorByRequestId('intercept-1', proxyError)
      }

      return {}
    })

    const { httpIntercept } = createStack({
      routes: [{
        id: 'route-1',
        hasInterceptor: true,
        routeMatcher: { url: 'http://example.com/*' },
        getFixture,
        matches: 0,
      }],
      cyIntercept,
    })

    await httpIntercept.handle({
      inFlightInterceptId: 'intercept-1',
      url: 'http://example.com/foo',
      method: 'GET',
      headers: {},
    }, vi.fn(async () => {
      return {
        statusCode: 200,
        headers: {},
        body: 'origin',
      }
    }))

    const networkErrorEmit = emit.mock.calls.find(([eventName]) => eventName === 'network:error')

    expect(networkErrorEmit).toBeDefined()
    expect(networkErrorEmit![1].data.error.message).toBe('stream failed')
  })

  it('emitNetworkErrorByRequestId clears the in-flight intercept entry', async () => {
    const cyIntercept = new CyIntercept({ socket })
    const emit = vi.spyOn(cyIntercept, 'emit')

    const { httpIntercept } = createStack({
      routes: [{
        id: 'route-1',
        hasInterceptor: true,
        routeMatcher: { url: 'http://example.com/*' },
        getFixture,
        matches: 0,
      }],
      cyIntercept,
    })

    vi.spyOn(cyIntercept, 'emitAndAwait').mockImplementation(() => new Promise(() => {}))

    void httpIntercept.handle({
      inFlightInterceptId: 'intercept-1',
      url: 'http://example.com/foo',
      method: 'GET',
      headers: {},
    }, vi.fn())

    await cyIntercept.emitNetworkErrorByRequestId('intercept-1', new Error('proxy abort'))

    emit.mockClear()

    await cyIntercept.emitNetworkErrorByRequestId('intercept-1', new Error('late'))

    expect(emit).not.toHaveBeenCalledWith('network:error', expect.anything())
  })

  it('emitNetworkErrorByRequestId clears deferred in-flight intercept after handle returns', async () => {
    const cyIntercept = new CyIntercept({ socket })
    const emit = vi.spyOn(cyIntercept, 'emit')

    vi.spyOn(cyIntercept, 'emitAndAwait').mockResolvedValue({})

    const { httpIntercept } = createStack({
      routes: [{
        id: 'route-1',
        hasInterceptor: true,
        routeMatcher: { url: 'http://example.com/*' },
        getFixture,
        matches: 0,
      }],
      cyIntercept,
    })

    const response = await httpIntercept.handle({
      inFlightInterceptId: 'intercept-1',
      url: 'http://example.com/foo',
      method: 'GET',
      headers: {},
    }, vi.fn(async () => {
      return {
        statusCode: 200,
        headers: {},
        body: 'origin',
      }
    }))

    expect(response.onResponseWrittenToClient).toBeDefined()

    await cyIntercept.emitNetworkErrorByRequestId('intercept-1', new Error('stream failed'))

    emit.mockClear()

    await cyIntercept.emitNetworkErrorByRequestId('intercept-1', new Error('late'))

    expect(emit).not.toHaveBeenCalledWith('network:error', expect.anything())
  })

  it('registers pending handlers on emitAndAwait and resolves them', async () => {
    const cyIntercept = new CyIntercept({ socket })

    const promise = cyIntercept.emitAndAwait('before:request', {
      eventId: 'event-1',
      data: {
        inFlightInterceptId: 'intercept-1',
        url: 'http://example.com',
        method: 'GET',
        headers: {},
      },
    } as any)

    expect(cyIntercept.pendingEventHandlers['event-1']).toMatchObject({
      eventName: 'before:request',
    })

    cyIntercept.resolveEventHandler({
      eventId: 'event-1',
      changedData: {
        url: 'http://example.com/changed',
        method: 'GET',
        headers: {},
        body: '',
        query: {},
        httpVersion: '1.1',
        resourceType: 'other',
      },
      stopPropagation: false,
    })

    await expect(promise).resolves.toEqual({
      changedData: {
        inFlightInterceptId: '',
        url: 'http://example.com/changed',
        method: 'GET',
        headers: {},
        body: '',
        resourceType: 'other',
      },
      stopPropagation: false,
    })

    expect(cyIntercept.pendingEventHandlers['event-1']).toBeUndefined()
  })

  it('forwards route:added via handleDriverEvent', async () => {
    const cyIntercept = new CyIntercept({ socket })

    await cyIntercept.handleDriverEvent('route:added', {
      routeId: 'route-1',
      hasInterceptor: true,
      routeMatcher: { url: '*' },
    }, getFixture)

    expect(cyIntercept.routes).toHaveLength(1)
    expect(cyIntercept.routes[0].id).toBe('route-1')
  })

  it('fulfills send:static:response while before:request is in flight', async () => {
    const cyIntercept = new CyIntercept({ socket })
    const httpIntercept = new HttpIntercept()

    httpIntercept.use(cyIntercept.middleware)

    let resolveBeforeRequest!: () => void

    vi.spyOn(cyIntercept, 'emitAndAwait').mockImplementation(async (eventName) => {
      if (eventName === 'before:request') {
        await new Promise<void>((resolve) => {
          resolveBeforeRequest = resolve
        })
      }

      return {}
    })

    cyIntercept.routes.push({
      id: 'route-1',
      hasInterceptor: true,
      routeMatcher: { url: 'http://example.com/*' },
      getFixture,
      matches: 0,
    })

    const handlePromise = httpIntercept.handle({
      inFlightInterceptId: 'intercept-1',
      url: 'http://example.com/foo',
      method: 'GET',
      headers: {},
    }, async () => {
      throw new Error('next should not be called')
    })

    await cyIntercept.handleDriverEvent('send:static:response', {
      requestId: 'intercept-1',
      staticResponse: {
        statusCode: 200,
        body: 'response body',
      },
    }, getFixture)

    resolveBeforeRequest()

    const response = await handlePromise

    expect(response.statusCode).toBe(200)
    expect(response.body).toBe('response body')
  })

  it('skips intercept for excluded dev-server paths', async () => {
    const cyIntercept = new CyIntercept({
      socket,
      config: { devServerPublicPathRoute: '/__cypress/src' },
    })
    const { httpIntercept } = createStack({
      routes: [{
        id: 'route-1',
        hasInterceptor: false,
        routeMatcher: { url: '*' },
        getFixture,
        matches: 0,
        staticResponse: { statusCode: 201, body: 'stubbed' },
      }],
      cyIntercept,
    })
    const next = vi.fn(async () => {
      return {
        statusCode: 200,
        headers: {},
        body: 'origin',
      }
    })

    const response = await httpIntercept.handle({
      inFlightInterceptId: 'intercept-1',
      url: 'http://localhost/__cypress/src/main.js',
      method: 'GET',
      headers: {},
    }, next)

    expect(next).toHaveBeenCalledOnce()
    expect(response.body).toBe('origin')
  })

  it('reset clears stale in-flight intercept state', async () => {
    const cyIntercept = new CyIntercept({ socket })
    const emit = vi.spyOn(cyIntercept, 'emit')

    const { httpIntercept } = createStack({
      routes: [{
        id: 'route-1',
        hasInterceptor: true,
        routeMatcher: { url: 'http://example.com/*' },
        getFixture,
        matches: 0,
      }],
      cyIntercept,
    })

    vi.spyOn(cyIntercept, 'emitAndAwait').mockImplementation(() => new Promise(() => {}))

    void httpIntercept.handle({
      inFlightInterceptId: 'intercept-1',
      url: 'http://example.com/foo',
      method: 'GET',
      headers: {},
    }, vi.fn())

    cyIntercept.reset()

    await cyIntercept.emitNetworkErrorByRequestId('intercept-1', new Error('late'))

    expect(emit).not.toHaveBeenCalledWith('network:error', expect.anything())
  })

  it('skips CORS preflight handling for excluded dev-server paths', async () => {
    const cyIntercept = new CyIntercept({
      socket,
      config: { devServerPublicPathRoute: '/__cypress/src' },
    })
    const { httpIntercept } = createStack({
      routes: [{
        id: 'route-1',
        hasInterceptor: false,
        routeMatcher: { url: '*' },
        getFixture,
        matches: 0,
      }],
      cyIntercept,
    })
    const next = vi.fn(async () => {
      return {
        statusCode: 200,
        headers: {},
        body: 'origin',
      }
    })

    const response = await httpIntercept.handle({
      inFlightInterceptId: 'intercept-1',
      url: 'http://localhost/__cypress/src/main.js',
      method: 'OPTIONS',
      headers: {
        'access-control-request-method': 'GET',
      },
    }, next)

    expect(next).toHaveBeenCalledOnce()
    expect(response.body).toBe('origin')
  })

  describe('e2e net_stubbing regressions', () => {
    const validJsonFixture = JSON.stringify({ foo: 1, bar: { baz: 'cypress' } })

    const createInterceptRoute = (id: string): BackendRoute => {
      return {
        id,
        hasInterceptor: true,
        routeMatcher: { url: 'http://example.com/foo-*' },
        getFixture,
        matches: 0,
      }
    }

    it('req.on(response) res.send({ fixture }) stubs origin 404 (can end response)', async () => {
      getFixture.mockResolvedValue(validJsonFixture)
      const cyIntercept = new CyIntercept({ socket })

      const { httpIntercept } = createStack({
        routes: [createInterceptRoute('route-1')],
        cyIntercept,
      })

      vi.spyOn(cyIntercept, 'emitAndAwait').mockImplementation(async (eventName, frame: any) => {
        if (eventName === 'before:request') {
          await cyIntercept.handleDriverEvent('subscribe', {
            requestId: frame.requestId,
            subscription: {
              routeId: 'route-1',
              eventName: 'response',
              await: true,
              id: 'sub-response',
            },
          }, getFixture)

          return { stopPropagation: false }
        }

        if (eventName === 'response') {
          await cyIntercept.handleDriverEvent('send:static:response', {
            requestId: frame.requestId,
            staticResponse: {
              statusCode: 200,
              headers: { 'content-type': 'application/json' },
              fixture: 'valid.json',
            },
          }, getFixture)

          return { stopPropagation: true }
        }

        return {}
      })

      const response = await httpIntercept.handle({
        inFlightInterceptId: 'intercept-1',
        url: 'http://example.com/foo-39',
        method: 'GET',
        headers: {},
      }, vi.fn(async () => {
        return {
          statusCode: 404,
          headers: { 'content-type': 'text/html' },
          body: '<html>Cannot GET /foo-39</html>',
        }
      }))

      expect(response.statusCode).toBe(200)
      expect(response.body).toBe(validJsonFixture)
    })

    it('req.reply(fn) res.send({ fixture }) stubs JSON (can reply with JSON fixture)', async () => {
      getFixture.mockResolvedValue(validJsonFixture)
      const cyIntercept = new CyIntercept({ socket })

      const { httpIntercept } = createStack({
        routes: [createInterceptRoute('route-1')],
        cyIntercept,
      })

      vi.spyOn(cyIntercept, 'emitAndAwait').mockImplementation(async (eventName, frame: any) => {
        if (eventName === 'before:request') {
          await cyIntercept.handleDriverEvent('subscribe', {
            requestId: frame.requestId,
            subscription: {
              routeId: 'route-1',
              eventName: 'response:callback',
              await: true,
              id: 'sub-callback',
            },
          }, getFixture)

          return { stopPropagation: true }
        }

        if (eventName === 'response:callback') {
          await cyIntercept.handleDriverEvent('send:static:response', {
            requestId: frame.requestId,
            staticResponse: {
              statusCode: 200,
              headers: { 'content-type': 'application/json' },
              fixture: 'valid.json',
            },
          }, getFixture)

          return { stopPropagation: true }
        }

        return {}
      })

      const response = await httpIntercept.handle({
        inFlightInterceptId: 'intercept-1',
        url: 'http://example.com/foo-39',
        method: 'GET',
        headers: {},
      }, vi.fn(async () => {
        return {
          statusCode: 200,
          headers: { 'content-type': 'application/json' },
          body: '{"ignored":true}',
        }
      }))

      expect(response.statusCode).toBe(200)
      expect(response.body).toBe(validJsonFixture)
    })

    it('response:callback runs only after subscribe is registered on the server', async () => {
      getFixture.mockResolvedValue(validJsonFixture)
      const cyIntercept = new CyIntercept({ socket })

      const { httpIntercept } = createStack({
        routes: [createInterceptRoute('route-1')],
        cyIntercept,
      })

      let releaseSubscribe: () => void
      const subscribeGate = new Promise<void>((resolve) => {
        releaseSubscribe = resolve
      })

      const handleDriverEvent = cyIntercept.handleDriverEvent.bind(cyIntercept)

      vi.spyOn(cyIntercept, 'handleDriverEvent').mockImplementation(async (eventName, frame, gf) => {
        if (eventName === 'subscribe') {
          await subscribeGate
        }

        return handleDriverEvent(eventName, frame, gf)
      })

      let responseCallbackReached = false

      vi.spyOn(cyIntercept, 'emitAndAwait').mockImplementation(async (eventName, frame: any) => {
        if (eventName === 'before:request') {
          void cyIntercept.handleDriverEvent('subscribe', {
            requestId: frame.requestId,
            subscription: {
              routeId: 'route-1',
              eventName: 'response:callback',
              await: true,
              id: 'sub-callback',
            },
          }, getFixture)

          return { stopPropagation: true }
        }

        if (eventName === 'response:callback') {
          responseCallbackReached = true

          await cyIntercept.handleDriverEvent('send:static:response', {
            requestId: frame.requestId,
            staticResponse: {
              statusCode: 200,
              headers: { 'content-type': 'application/json' },
              fixture: 'valid.json',
            },
          }, getFixture)

          return { stopPropagation: true }
        }

        return {}
      })

      const responsePromise = httpIntercept.handle({
        inFlightInterceptId: 'intercept-1',
        url: 'http://example.com/foo-39',
        method: 'GET',
        headers: {},
      }, vi.fn(async () => {
        return {
          statusCode: 200,
          headers: { 'content-type': 'application/json' },
          body: '{"ignored":true}',
        }
      }))

      await Promise.resolve()
      expect(responseCallbackReached).toBe(false)

      releaseSubscribe!()

      const response = await responsePromise

      expect(responseCallbackReached).toBe(true)
      expect(response.body).toBe(validJsonFixture)
    })

    it('req.reply(fn) can delete a response header via response:callback', async () => {
      const cyIntercept = new CyIntercept({ socket })

      const { httpIntercept } = createStack({
        routes: [createInterceptRoute('route-1')],
        cyIntercept,
      })

      vi.spyOn(cyIntercept, 'emitAndAwait').mockImplementation(async (eventName, frame: any) => {
        if (eventName === 'before:request') {
          await cyIntercept.handleDriverEvent('subscribe', {
            requestId: frame.requestId,
            subscription: {
              routeId: 'route-1',
              eventName: 'response:callback',
              await: true,
              id: 'sub-callback',
            },
          }, getFixture)

          return { stopPropagation: true }
        }

        if (eventName === 'response:callback') {
          const changedData = {
            ...frame.data,
            headers: { ...frame.data.headers },
          }

          delete changedData.headers['content-type']

          return {
            stopPropagation: false,
            changedData,
          }
        }

        return {}
      })

      const response = await httpIntercept.handle({
        inFlightInterceptId: 'intercept-1',
        url: 'http://example.com/foo-json-content-type',
        method: 'GET',
        headers: {},
      }, vi.fn(async () => {
        return {
          statusCode: 200,
          headers: { 'content-type': 'application/json' },
          body: '{"ok":true}',
        }
      }))

      expect(response.headers['content-type']).toBeUndefined()
      expect(response.body).toBe('{"ok":true}')
    })
  })

  describe('._restoreMatcherOptionsTypes', () => {
    it('rehydrates regexes properly', () => {
      const { url } = _restoreMatcherOptionsTypes({
        url: {
          type: 'regex',
          value: '/aaa/igm',
        },
      })

      expect(url).toBeInstanceOf(RegExp)
      expect(url).toMatchObject({
        flags: 'gim',
        source: 'aaa',
      })
    })
  })
})
