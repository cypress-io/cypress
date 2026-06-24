import { describe, it, expect, vi, beforeEach } from 'vitest'
import errors from '@packages/errors'
import { HttpIntercept } from '@packages/network-interception'
import type { BackendRoute, InterceptRegistrationRequest } from '@packages/network-interception'
import { CyIntercept } from '../../lib/cy-intercept'

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

    const registration = cyIntercept.createInterceptRegistration({ getFixture })

    const handlePromise = httpIntercept.handle({
      inFlightInterceptId: 'intercept-1',
      url: 'http://example.com/foo',
      method: 'GET',
      headers: {},
    }, async () => {
      throw new Error('next should not be called')
    })

    await registration.handleEvent({
      eventName: 'send:static:response',
      frame: {
        requestId: 'intercept-1',
        staticResponse: {
          statusCode: 200,
          body: 'response body',
        },
      },
    })

    resolveBeforeRequest()

    const response = await handlePromise

    expect(response.statusCode).toBe(200)
    expect(response.body).toBe('response body')
  })

  it('createInterceptRegistration delegates to handleDriverEvent', async () => {
    const cyIntercept = new CyIntercept({ socket })
    const handleDriverEvent = vi.spyOn(cyIntercept, 'handleDriverEvent')
    const registration = cyIntercept.createInterceptRegistration({ getFixture })
    const request: InterceptRegistrationRequest = {
      eventName: 'route:added',
      frame: {
        routeId: 'route-1',
        hasInterceptor: false,
        routeMatcher: { url: { type: 'glob', value: '**/api/*' } },
      },
    }

    await registration.handleEvent(request)

    expect(handleDriverEvent).toHaveBeenCalledOnce()
    expect(handleDriverEvent).toHaveBeenCalledWith('route:added', request.frame, getFixture)
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
})
