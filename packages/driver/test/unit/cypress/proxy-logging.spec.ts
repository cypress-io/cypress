import { describe, it, expect, vi, beforeEach } from 'vitest'
import ProxyLogging from '../../../src/cypress/proxy-logging'
import type { Interception, Route } from '../../../src/cy/net-stubbing/types'

describe('ProxyLogging static stub logs', () => {
  let proxyLogging: ProxyLogging
  let logSet: ReturnType<typeof vi.fn>
  let logSnapshot: ReturnType<typeof vi.fn>
  let logEnd: ReturnType<typeof vi.fn>
  let logInstance: any

  beforeEach(() => {
    logSet = vi.fn()
    logSnapshot = vi.fn().mockReturnThis()
    logEnd = vi.fn().mockReturnThis()
    logInstance = {
      set: logSet,
      snapshot: logSnapshot,
      end: logEnd,
      get: vi.fn(() => undefined),
    }

    proxyLogging = new ProxyLogging({
      log: vi.fn(() => logInstance),
      on: vi.fn(),
    } as any)

    ;(proxyLogging as any).logIncomingRequest({
      requestId: 'browser-req-1',
      url: 'http://localhost:3500/some-url',
      method: 'GET',
      resourceType: 'fetch',
    } as any)
  })

  it('attaches static stub interceptions when browserRequestId is missing at first', () => {
    const interception: Interception = {
      id: 'in-flight-1',
      routeId: 'route-1',
      browserRequestId: undefined as any,
      request: {
        url: 'http://localhost:3500/some-url',
        method: 'GET',
        headers: {},
        body: '',
        query: {},
        httpVersion: '1.1',
        resourceType: 'fetch',
      },
      state: 'Received',
      requestWaited: false,
      responseWaited: false,
      subscriptions: [],
      setLogFlag: vi.fn(),
    }

    const route = {
      id: 'route-1',
      handler: 'stubbed response',
      options: { url: '/some-url' },
      alias: 'alias',
      requests: {},
    } as unknown as Route

    const proxyRequest = proxyLogging.logInterception(interception, route)

    expect(proxyRequest).toBeDefined()
    expect(proxyRequest!.interceptions).toHaveLength(1)
    expect(proxyRequest!.flags.stubbed).toBe(true)
    expect(interception.browserRequestId).toBe('browser-req-1')

    interception.pendingResponse = {
      url: 'http://localhost:3500/some-url',
      statusCode: 200,
      statusMessage: 'OK',
      headers: {},
      body: 'stubbed response',
    }

    proxyLogging.refreshInterceptionLog(interception)

    expect(logSet).toHaveBeenCalled()
  })
})
