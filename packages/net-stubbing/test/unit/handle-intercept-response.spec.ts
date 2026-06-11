import { describe, it, expect, vi } from 'vitest'
import { EventEmitter } from 'events'
import { PassThrough, Readable } from 'stream'
import { handleInterceptResponse } from '../../lib/server/handle-intercept-response'
import { handleInterceptRequest } from '../../lib/server/handle-intercept-request'
import { InterceptedRequest } from '../../lib/server/intercepted-request'
import { state as NetStubbingState } from '../../lib/server/state'
import type { NetStubbingState as TNetStubbingState } from '../../lib/server/types'

const consumeStream = (stream: Readable): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []

    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    stream.on('end', () => resolve(Buffer.concat(chunks)))
    stream.on('error', reject)
  })
}

const makeInterceptedRequest = ({ state, socket, hasInterceptor = false }: { state: TNetStubbingState, socket: any, hasInterceptor?: boolean }) => {
  const res = new EventEmitter() as any

  const request = new InterceptedRequest({
    req: {
      matchingRoutes: [
        // @ts-ignore
        { id: '1', hasInterceptor, routeMatcher: {} },
      ],
    } as any,
    res,
    continueRequest: () => {},
    onError: (err) => {
      throw err
    },
    onResponse: () => {},
    state,
    socket,
  })

  request.addDefaultSubscriptions()

  state.requests[request.id] = request

  return request
}

const makeMw = ({ state, request, incomingResStream, method = 'GET', statusCode = 200 }: {
  state: TNetStubbingState
  request: InterceptedRequest
  incomingResStream: Readable
  method?: string
  statusCode?: number
}) => {
  const mw: any = {
    req: { requestId: request.id, proxiedUrl: 'http://localhost/test', method },
    res: request.res,
    netStubbingState: state,
    incomingRes: {
      statusCode,
      statusMessage: 'OK',
      httpVersion: '1.1',
      headers: { 'content-type': 'text/plain' },
    },
    incomingResStream,
    makeResStreamPlainText: vi.fn(),
    onError: (err: Error) => {
      throw err
    },
    next: vi.fn(),
  }

  return mw
}

describe('handleInterceptResponse', () => {
  it('calls next() when there is no intercepted request', async () => {
    const state = NetStubbingState()
    const mw: any = {
      req: { requestId: 'nonexistent' },
      netStubbingState: state,
      next: vi.fn(),
    }

    await handleInterceptResponse(mw)

    expect(mw.next).toHaveBeenCalledOnce()
  })

  describe('with only notification subscriptions (spying)', () => {
    it('continues the response without waiting for the body and emits response:callback with the buffered body', async () => {
      const state = NetStubbingState()
      const events: any[] = []
      const socket = {
        toDriver: vi.fn((_event, eventName, frame) => {
          events.push({ eventName, frame })
        }),
      }

      const request = makeInterceptedRequest({ state, socket })
      const source = new PassThrough()
      const mw = makeMw({ state, request, incomingResStream: source })

      source.write('partial ')

      await handleInterceptResponse(mw)

      // next() must be called while the origin response is still streaming
      expect(mw.next).toHaveBeenCalledOnce()
      expect(socket.toDriver).not.toHaveBeenCalled()

      const clientBody = consumeStream(mw.incomingResStream)

      source.write('body')
      source.end()

      expect((await clientBody).toString()).toEqual('partial body')

      await request.pendingResponseNotifications

      const responseEvents = events.filter(({ eventName }) => eventName === 'response:callback')

      expect(responseEvents).toHaveLength(1)
      expect(responseEvents[0].frame.data).toMatchObject({
        statusCode: 200,
        url: 'http://localhost/test',
        body: 'partial body',
      })

      // the final body is also reflected on the outgoing response object
      expect((request.res as any).body).toEqual('partial body')
    })

    it('preserves binary bodies as Buffers in the notification', async () => {
      const state = NetStubbingState()
      const events: any[] = []
      const socket = {
        toDriver: vi.fn((_event, eventName, frame) => {
          events.push({ eventName, frame })
        }),
      }

      const request = makeInterceptedRequest({ state, socket })
      const source = new PassThrough()
      const mw = makeMw({ state, request, incomingResStream: source })

      await handleInterceptResponse(mw)

      const binary = Buffer.from([0x00, 0xff, 0xfe, 0x00, 0x01, 0x02])
      const clientBody = consumeStream(mw.incomingResStream)

      source.end(binary)

      expect((await clientBody).equals(binary)).toBe(true)

      await request.pendingResponseNotifications

      const responseEvent = events.find(({ eventName }) => eventName === 'response:callback')

      expect(Buffer.isBuffer(responseEvent.frame.data.body)).toBe(true)
      expect(responseEvent.frame.data.body.equals(binary)).toBe(true)
    })

    it('emits response:callback with an empty body when the response must have an empty body', async () => {
      const state = NetStubbingState()
      const events: any[] = []
      const socket = {
        toDriver: vi.fn((_event, eventName, frame) => {
          events.push({ eventName, frame })
        }),
      }

      const request = makeInterceptedRequest({ state, socket })
      const source = new PassThrough()
      const mw = makeMw({ state, request, incomingResStream: source, statusCode: 304 })

      await handleInterceptResponse(mw)

      expect(mw.next).toHaveBeenCalledOnce()

      const responseEvent = events.find(({ eventName }) => eventName === 'response:callback')

      expect(responseEvent.frame.data.body).toEqual('')
    })
  })

  describe('with awaited subscriptions (response handler)', () => {
    it('buffers the body before continuing and applies driver changes', async () => {
      const state = NetStubbingState()
      const socket = {
        toDriver: vi.fn((_event, _eventName, frame) => {
          if (!frame.subscription.await) {
            return
          }

          // simulate the driver modifying the response body
          setImmediate(() => {
            state.pendingEventHandlers[frame.eventId]({
              changedData: { ...frame.data, body: 'changed!' },
              stopPropagation: false,
            })
          })
        }),
      }

      const request = makeInterceptedRequest({ state, socket, hasInterceptor: true })

      request.addSubscription({
        id: 'sub1',
        routeId: '1',
        eventName: 'response:callback',
        await: true,
      })

      const source = new PassThrough()
      const mw = makeMw({ state, request, incomingResStream: source })

      const handled = handleInterceptResponse(mw)

      source.end('original')

      await handled

      expect(mw.next).toHaveBeenCalledOnce()

      const clientBody = await consumeStream(mw.incomingResStream)

      expect(clientBody.toString()).toEqual('changed!')
    })
  })
})

describe('handleInterceptRequest', () => {
  it('waits for pending response notifications before emitting after:response', async () => {
    const state = NetStubbingState()
    const events: string[] = []
    const socket = {
      toDriver: vi.fn((_event, eventName) => {
        events.push(eventName)
      }),
    }

    const req: any = new PassThrough()

    req.matchingRoutes = [{ id: '1', hasInterceptor: false, routeMatcher: {}, matches: 0 }]
    req.proxiedUrl = 'http://localhost/test'
    req.headers = {}

    const res: any = new EventEmitter()

    res.destroyed = false

    const mw: any = {
      req,
      res,
      netStubbingState: state,
      socket,
      debug: () => {},
      next: vi.fn(),
      end: vi.fn(),
      onError: (err: Error) => {
        throw err
      },
      onResponse: () => {},
    }

    req.end('')

    await handleInterceptRequest(mw, {
      mergeIncomingRequestChanges: () => req.proxiedUrl,
    } as any)

    expect(mw.next).toHaveBeenCalledOnce()

    const request = Object.values(state.requests)[0]

    let resolveNotifications!: () => void

    request.pendingResponseNotifications = new Promise((resolve) => {
      resolveNotifications = () => {
        events.push('lazy:notifications:sent')
        resolve()
      }
    })

    res.emit('finish')

    // allow microtasks to run - after:response must not have been emitted yet
    await new Promise((resolve) => setImmediate(resolve))

    expect(events).not.toContain('after:response')

    resolveNotifications()

    await new Promise((resolve) => setImmediate(resolve))

    expect(events.indexOf('after:response')).toBeGreaterThan(events.indexOf('lazy:notifications:sent'))
    expect(state.requests).toEqual({})
  })
})
