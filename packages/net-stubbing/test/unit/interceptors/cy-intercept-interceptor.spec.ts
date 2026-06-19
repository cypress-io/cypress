import { describe, it, expect, vi } from 'vitest'
import type { BackendRoute, ForInterceptionEvents } from '@packages/network-interception'
import { createDriverAdapter } from '../../../lib/adapters/create-driver-adapter'

describe('createCyInterceptInterceptor', () => {
  const createStack = (options: {
    routes?: BackendRoute[]
    interceptionEvents?: Partial<ForInterceptionEvents>
  } = {}) => {
    const driverAdapter = createDriverAdapter({
      stubbing: { routes: options.routes ?? [] },
      socket: { toDriver: vi.fn() },
    })

    if (options.interceptionEvents?.emitAndAwait) {
      vi.spyOn(driverAdapter.interceptionEvents, 'emitAndAwait').mockImplementation(options.interceptionEvents.emitAndAwait)
    }

    if (options.interceptionEvents?.emit) {
      vi.spyOn(driverAdapter.interceptionEvents, 'emit').mockImplementation(options.interceptionEvents.emit)
    }

    if (options.interceptionEvents?.resolveEventHandler) {
      vi.spyOn(driverAdapter.interceptionEvents, 'resolveEventHandler').mockImplementation(options.interceptionEvents.resolveEventHandler)
    }

    return driverAdapter
  }

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
        getFixture: async () => '',
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
        getFixture: async () => '',
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
    const emitAndAwait = vi.fn(async () => {
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
        getFixture: async () => '',
        matches: 0,
      }],
      interceptionEvents: {
        emitAndAwait,
        emit: vi.fn(),
        resolveEventHandler: vi.fn(),
      },
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
})
