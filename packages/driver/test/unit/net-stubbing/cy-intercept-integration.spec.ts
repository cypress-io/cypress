import { describe, it, expect, vi, beforeEach } from 'vitest'
import { HttpIntercept } from '@packages/network-interception'
import { CyIntercept } from '@packages/net-stubbing'
import { registerEvents } from '../../../src/cy/net-stubbing/events'
import type { Route } from '../../../src/cy/net-stubbing/types'
import { EventEmitter } from 'events'

describe('driver + CyIntercept integration (response-stage res.send)', () => {
  const validJsonFixture = JSON.stringify({ foo: 1, bar: { baz: 'cypress' } })
  const getFixture = vi.fn(async () => validJsonFixture)

  const createRoute = (): Route => {
    return {
      id: 'route-1',
      handler: vi.fn(),
      options: { url: '/foo-*' },
      requests: {},
      hitCount: 0,
      log: {
        get: vi.fn(() => 0),
        set: vi.fn(),
      },
    } as unknown as Route
  }

  beforeEach(() => {
    getFixture.mockClear()
  })

  const runWithRegisterEvents = async (options: {
    handler: Route['handler']
  }) => {
    const socket = new EventEmitter() as any
    const cyIntercept = new CyIntercept({ socket })
    const httpIntercept = new HttpIntercept()
    const route = createRoute()

    cyIntercept.routes.push({
      id: route.id,
      hasInterceptor: true,
      routeMatcher: { url: '/foo-*' },
      getFixture,
      matches: 0,
    })

    httpIntercept.use(cyIntercept.middleware)

    const routes = { [route.id]: route }

    routes[route.id] = {
      ...route,
      handler: options.handler,
      options: { url: '/foo-*' },
    }

    const Cypress = {
      config: vi.fn((key: string) => key === 'responseTimeout' ? 30000 : 4000),
      state: vi.fn((key?: string) => {
        if (key === 'routes') {
          return routes
        }

        return undefined
      }),
      on: vi.fn((eventName: string, handler: (...args: any[]) => void) => {
        if (eventName === 'net:stubbing:event') {
          (Cypress as any)._netHandler = handler
        }
      }),
      ProxyLogging: {
        logInterception: vi.fn(() => ({ setFlag: vi.fn() })),
        refreshInterceptionLog: vi.fn(),
      },
      backend: vi.fn(async (channel: string, eventName: string, frame: any) => {
        if (channel !== 'net') {
          return
        }

        return cyIntercept.handleDriverEvent(eventName, frame, getFixture)
      }),
    } as unknown as Cypress.Cypress

    registerEvents(Cypress, { fail: vi.fn() } as any)

    socket.toDriver = (_channel: string, eventName: string, frame: any) => {
      void (Cypress as any)._netHandler(eventName, frame)
    }

    const response = await httpIntercept.handle({
      inFlightInterceptId: 'intercept-1',
      url: '/foo-39',
      method: 'GET',
      headers: {},
    }, vi.fn(async () => {
      return {
        statusCode: 404,
        headers: { 'content-type': 'text/html' },
        body: '<html>Cannot GET /foo-39</html>',
      }
    }))

    return response
  }

  it('registerEvents + socket round-trip stubs response-stage res.send({ body })', async () => {
    const response = await runWithRegisterEvents({
      handler: (req) => {
        req.reply((res) => {
          res.send({
            statusCode: 200,
            headers: { 'content-type': 'text/plain' },
            body: 'stubbed-at-response',
          })
        })
      },
    })

    expect(response.statusCode).toBe(200)
    expect(response.body).toBe('stubbed-at-response')
  })

  it('registerEvents + socket round-trip stubs response-stage res.send({ fixture })', async () => {
    const response = await runWithRegisterEvents({
      handler: (req) => {
        req.reply((res) => {
          res.headers['content-type'] = 'application/json'
          res.send({
            statusCode: 200,
            fixture: 'valid.json',
          })
        })
      },
    })

    expect(response.statusCode).toBe(200)
    expect(response.body).toBe(validJsonFixture)
  })
})
