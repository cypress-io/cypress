import { describe, it, expect, vi } from 'vitest'
import { onBeforeRequest } from '../../../src/cy/net-stubbing/events/before-request'
import type { Interception, Route } from '../../../src/cy/net-stubbing/types'

describe('net-stubbing before:request events (e2e regressions)', () => {
  const createRoute = (): Route => {
    return {
      id: 'route-1',
      handler: vi.fn(),
      options: {},
      requests: {},
      hitCount: 0,
      log: {
        get: vi.fn(() => 0),
        set: vi.fn(),
      },
    } as unknown as Route
  }

  const createFrame = (req: { url: string, method?: string }) => {
    return {
      requestId: 'intercept-1',
      browserRequestId: 'browser-1',
      eventId: 'event-1',
      subscription: {
        routeId: 'route-1',
        eventName: 'before:request',
        await: true,
      },
      data: {
        url: req.url,
        method: req.method ?? 'GET',
        headers: {},
        body: '',
        query: {},
        httpVersion: '1.1',
        resourceType: 'xhr',
      },
    }
  }

  const runHandler = async (options: {
    userHandler: (req: any) => void
    emitNetEvent?: ReturnType<typeof vi.fn>
  }) => {
    const route = createRoute()
    const routes = { 'route-1': route }
    const eventLog: string[] = []

    let releaseSubscribe: () => void
    const subscribeGate = new Promise<void>((resolve) => {
      releaseSubscribe = resolve
    })

    const emitNetEvent = options.emitNetEvent ?? vi.fn(async (eventName: string) => {
      if (eventName === 'subscribe') {
        eventLog.push('subscribe:start')
        await subscribeGate
        eventLog.push('subscribe:done')
      }
    })

    const Cypress = {
      config: vi.fn(() => 4000),
      state: vi.fn(),
      ProxyLogging: {
        logInterception: vi.fn(() => ({ setFlag: vi.fn() })),
      },
    } as unknown as Cypress.Cypress

    route.handler = options.userHandler

    const handlerPromise = onBeforeRequest(
      Cypress,
      createFrame({ url: 'http://localhost/foo-1' }) as any,
      options.userHandler,
      {
        getRoute: (routeId: string) => routes[routeId],
        getRequest: (routeId: string, requestId: string) => routes[routeId]?.requests[requestId],
        emitNetEvent,
        sendStaticResponse: vi.fn(),
      },
    )

    let handlerResolved = false

    void handlerPromise?.then(() => {
      eventLog.push('handler:resolved')
      handlerResolved = true
    })

    await Promise.resolve()
    await Promise.resolve()

    return {
      eventLog,
      getHandlerResolved: () => handlerResolved,
      releaseSubscribe: () => releaseSubscribe(),
      awaitHandler: () => handlerPromise,
      route,
    }
  }

  it('req.on() registers subscribe before before:request resolves', async () => {
    const { eventLog, getHandlerResolved, releaseSubscribe, awaitHandler } = await runHandler({
      userHandler: (req) => {
        req.on('response', vi.fn())
      },
    })

    expect(getHandlerResolved()).toBe(false)
    expect(eventLog).toEqual(['subscribe:start'])

    releaseSubscribe()
    await awaitHandler()

    expect(eventLog).toEqual(['subscribe:start', 'subscribe:done', 'handler:resolved'])
  })

  it('req.reply(fn) registers subscribe before before:request resolves', async () => {
    let handlerResult: unknown
    let handlerSettled = false

    const route = createRoute()
    const routes = { 'route-1': route }
    const eventLog: string[] = []

    let releaseSubscribe: () => void
    const subscribeGate = new Promise<void>((resolve) => {
      releaseSubscribe = resolve
    })

    const emitNetEvent = vi.fn(async (eventName: string) => {
      if (eventName === 'subscribe') {
        eventLog.push('subscribe:start')
        await subscribeGate
        eventLog.push('subscribe:done')
      }
    })

    const Cypress = {
      config: vi.fn(() => 4000),
      state: vi.fn(),
      ProxyLogging: {
        logInterception: vi.fn(() => ({ setFlag: vi.fn() })),
      },
    } as unknown as Cypress.Cypress

    const userHandler = (req: any) => {
      req.reply((res: any) => {
        res.send({ statusCode: 200, body: 'stubbed' })
      })
    }

    route.handler = userHandler

    const handlerPromise = onBeforeRequest(
      Cypress,
      createFrame({ url: 'http://localhost/foo-1' }) as any,
      userHandler,
      {
        getRoute: (routeId: string) => routes[routeId],
        getRequest: (routeId: string, requestId: string) => routes[routeId]?.requests[requestId],
        emitNetEvent,
        sendStaticResponse: vi.fn(),
      },
    )

    void handlerPromise?.then((result) => {
      eventLog.push('handler:resolved')
      handlerResult = result
      handlerSettled = true
    })

    await Promise.resolve()
    await Promise.resolve()

    expect(eventLog).toEqual(['subscribe:start'])
    expect(handlerSettled).toBe(false)

    releaseSubscribe!()
    await handlerPromise

    expect(handlerSettled).toBe(true)
    expect(handlerResult).toEqual({
      changedData: expect.objectContaining({ url: 'http://localhost/foo-1' }),
      stopPropagation: true,
    })

    expect(eventLog).toEqual(['subscribe:start', 'subscribe:done', 'handler:resolved'])
  })

  it('req.reply(fn) attaches response:callback subscription on the interception', async () => {
    const { releaseSubscribe, awaitHandler, route } = await runHandler({
      userHandler: (req) => {
        req.reply((res) => {
          delete res.headers['content-type']
        })
      },
    })

    releaseSubscribe()
    await awaitHandler()

    const interception = route.requests['intercept-1'] as Interception

    expect(interception.subscriptions).toHaveLength(1)
    expect(interception.subscriptions[0].subscription.eventName).toBe('response:callback')
  })
})
