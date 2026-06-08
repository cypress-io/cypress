import { describe, it, expect, vi } from 'vitest'
import { HttpInterception } from '../../lib/core/http-interception'
import type { BackendRoute } from '../../lib/types/backend-route'
import type { ForInterceptionEvents } from '../../lib/ports/interception-events'
import { createTestWireMessages } from '../../lib/testing/wire-messages'

describe('HttpInterception', () => {
  const createInterception = (options: {
    routes?: BackendRoute[]
    interceptionEvents?: ForInterceptionEvents
  } = {}) => {
    const interceptionEvents: ForInterceptionEvents = options.interceptionEvents ?? {
      emitAndAwait: vi.fn(async () => ({})),
      emit: vi.fn(),
      resolveEventHandler: vi.fn(),
    }

    return new HttpInterception({
      getRoutes: () => options.routes ?? [],
      interceptionEvents,
      wireMessages: createTestWireMessages(),
    })
  }

  it('calls next when no routes match', async () => {
    const interception = createInterception()
    const next = vi.fn(async () => ({
      statusCode: 200,
      headers: {},
      body: 'origin',
    }))

    const response = await interception.handle({
      inFlightInterceptId: 'intercept-1',
      url: 'http://example.com/',
      method: 'GET',
      headers: {},
    }, next)

    expect(next).toHaveBeenCalledOnce()
    expect(response.body).toBe('origin')
  })

  it('returns preflight response without calling next', async () => {
    const interception = createInterception({
      routes: [{
        id: 'route-1',
        hasInterceptor: true,
        routeMatcher: { url: '*' },
        getFixture: async () => '',
        matches: 0,
      }],
    })
    const next = vi.fn()

    const response = await interception.handle({
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
    const interception = createInterception({
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

    const response = await interception.handle({
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
    const emitAndAwait = vi.fn(async () => ({
      changedData: {
        url: 'http://example.com/foo',
        method: 'GET',
        headers: { 'x-test': 'changed' },
        body: '',
      },
    }))

    const interception = createInterception({
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

    await interception.handle({
      inFlightInterceptId: 'intercept-1',
      url: 'http://example.com/foo',
      method: 'GET',
      headers: {},
    }, next)

    expect(next).toHaveBeenCalledOnce()
    expect(emitAndAwait).toHaveBeenCalled()
  })
})
