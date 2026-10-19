import dns from 'dns'
import http from 'http'
import type { AddressInfo } from 'net'
import Bluebird from 'bluebird'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { Request, RequestAbandonedError } from '../../lib/request'

const waitFor = async (condition: () => boolean, timeout = 2000) => {
  const start = Date.now()

  while (!condition()) {
    if (Date.now() - start > timeout) {
      throw new Error('timed out waiting for condition')
    }

    await Bluebird.delay(10)
  }
}

const deferred = <T = unknown>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })

  return { promise, resolve }
}

describe('lib/request cancellation', () => {
  let request: Request
  let srv: http.Server
  let port: number
  let hits: Record<string, number>
  let clientAborted: Record<string, boolean>
  let unhandled: unknown[]
  let originalResultOrder: ReturnType<typeof dns.getDefaultResultOrder>
  const openResponses = new Set<http.ServerResponse>()

  const onUnhandled = (reason: unknown) => {
    unhandled.push(reason)
  }

  const url = (path: string) => `http://localhost:${port}${path}`

  const inFlight = (): Map<string, AbortController> => (request as any).inFlight

  const automationFn = vi.fn((msg: string, data?: any): Promise<any> => {
    if (msg === 'get:cookies') {
      return Promise.resolve([])
    }

    return Promise.resolve({})
  })

  const setCookieCalls = () => automationFn.mock.calls.filter(([msg]) => msg === 'set:cookie')

  beforeAll(() => {
    originalResultOrder = dns.getDefaultResultOrder()
    dns.setDefaultResultOrder('ipv4first')
  })

  afterAll(() => {
    dns.setDefaultResultOrder(originalResultOrder)
  })

  beforeEach(async () => {
    request = new Request()
    hits = {}
    clientAborted = {}
    unhandled = []
    automationFn.mockClear()
    process.on('unhandledRejection', onUnhandled)

    srv = http.createServer((req, res) => {
      const path = req.url!.split('?')[0]

      hits[path] = (hits[path] || 0) + 1
      openResponses.add(res)

      res.on('close', () => {
        openResponses.delete(res)

        if (!res.writableEnded) {
          clientAborted[path] = true
        }
      })

      switch (path) {
        case '/ok':
          res.writeHead(200, { 'set-cookie': 'ok=1', 'content-type': 'text/plain' })

          return res.end('ok')
        case '/trickle': {
          res.writeHead(200, { 'set-cookie': 'late=1', 'content-type': 'text/plain' })

          let chunks = 0
          const interval = setInterval(() => {
            if (res.destroyed) {
              return clearInterval(interval)
            }

            res.write('.')

            // 10s, longer than the safety-net deadline of the shortest timeout below
            if (++chunks === 200) {
              clearInterval(interval)
              res.end()
            }
          }, 50)

          return
        }
        case '/econnreset':
          return req.socket.destroy()
        case '/redirect':
          res.writeHead(302, { 'set-cookie': 'hop=1', location: '/ok' })

          return res.end()
        default:
          res.writeHead(404)

          return res.end()
      }
    })

    await new Promise<void>((resolve) => srv.listen(0, resolve))
    port = (srv.address() as AddressInfo).port
  })

  afterEach(async () => {
    openResponses.forEach((res) => res.destroy())
    srv.closeAllConnections()
    await new Promise((resolve) => srv.close(resolve))
    // give any stray rejection a chance to surface before checking
    await Bluebird.delay(20)
    process.off('unhandledRejection', onUnhandled)
    expect(unhandled).toEqual([])
  })

  it('aborts the underlying request mid-body and never sets its cookies', async () => {
    const p = request.sendPromise('ua', automationFn, { url: url('/trickle'), timeout: 500 }, 'id-1')

    await waitFor(() => hits['/trickle'] === 1)
    // let the headers and a few chunks arrive
    await Bluebird.delay(150)

    request.cancel('id-1')

    await expect(p).rejects.toBeInstanceOf(RequestAbandonedError)
    await waitFor(() => clientAborted['/trickle'] === true)

    await Bluebird.delay(100)
    expect(setCookieCalls()).toEqual([])
    expect(inFlight().size).toBe(0)
  })

  it('settles as soon as it is cancelled, without waiting for the body', async () => {
    const p = request.sendPromise('ua', automationFn, { url: url('/trickle'), timeout: 500 }, 'id-1')

    await waitFor(() => hits['/trickle'] === 1)

    const start = Date.now()

    request.cancel('id-1')

    await expect(p).rejects.toMatchObject({ isRequestAbandoned: true })
    expect(Date.now() - start).toBeLessThan(100)
  })

  it('does not start another attempt when cancelled during a retry delay', async () => {
    const p = request.sendPromise('ua', automationFn, {
      url: url('/econnreset'),
      retryIntervals: [300, 300],
      timeout: 1000,
    }, 'id-1')

    await waitFor(() => hits['/econnreset'] === 1)
    // the first attempt fails at once and the retry waits 300ms
    await Bluebird.delay(50)

    request.cancel('id-1')

    await expect(p).rejects.toBeInstanceOf(RequestAbandonedError)

    await Bluebird.delay(400)
    expect(hits['/econnreset']).toBe(1)
  })

  it('does not follow or sync cookies for the next redirect hop when cancelled mid-hop', async () => {
    const hopCookie = deferred()

    automationFn.mockImplementation((msg: string) => {
      if (msg === 'set:cookie') {
        return hopCookie.promise
      }

      if (msg === 'get:cookies') {
        return Promise.resolve([])
      }

      return Promise.resolve({})
    })

    const p = request.sendPromise('ua', automationFn, { url: url('/redirect'), timeout: 1000 }, 'id-1')

    await waitFor(() => setCookieCalls().length === 1)

    request.cancel('id-1')
    hopCookie.resolve({})

    await expect(p).rejects.toBeInstanceOf(RequestAbandonedError)

    await Bluebird.delay(100)
    expect(hits['/ok']).toBeUndefined()
    expect(automationFn).not.toHaveBeenCalledWith('get:cookies', { url: url('/ok') })
    // only the hop's own cookie, whose write had already started before the cancel
    expect(setCookieCalls()).toHaveLength(1)
  })

  it('sends nothing when cancelled during the cookie prefetch', async () => {
    const cookies = deferred<any[]>()

    automationFn.mockImplementation((msg: string) => {
      if (msg === 'get:cookies') {
        return cookies.promise
      }

      return Promise.resolve({})
    })

    const p = request.sendPromise('ua', automationFn, { url: url('/ok'), timeout: 1000 }, 'id-1')

    await waitFor(() => automationFn.mock.calls.length === 1)

    request.cancel('id-1')
    cookies.resolve([])

    await expect(p).rejects.toBeInstanceOf(RequestAbandonedError)

    await Bluebird.delay(100)
    expect(hits['/ok']).toBeUndefined()
  })

  it('behaves as before for a request that completes in time, and forgets it', async () => {
    const resp = await request.sendPromise('ua', automationFn, { url: url('/ok'), timeout: 1000 }, 'id-1')

    expect(resp.status).toBe(200)
    expect(resp.body).toBe('ok')
    expect(resp.duration).toBeTypeOf('number')
    expect(setCookieCalls()).toHaveLength(1)
    expect(setCookieCalls()[0][1]).toMatchObject({ name: 'ok', value: '1' })
    expect(inFlight().size).toBe(0)

    // cancelling a finished request is a no-op
    expect(() => request.cancel('id-1')).not.toThrow()
  })

  it('forgets a request that fails', async () => {
    const p = request.sendPromise('ua', automationFn, {
      url: url('/econnreset'),
      retryOnNetworkFailure: false,
      timeout: 1000,
    }, 'id-1')

    expect(inFlight().size).toBe(1)

    await expect(p).rejects.toMatchObject({ error: { code: 'ECONNRESET' } })
    expect(inFlight().size).toBe(0)
  })

  it('ignores a cancel for an unknown id', async () => {
    const p = request.sendPromise('ua', automationFn, { url: url('/ok'), timeout: 1000 }, 'id-1')

    request.cancel('some-other-id')

    await expect(p).resolves.toMatchObject({ status: 200 })
  })

  it('abandons the request on its own when no cancel arrives', async () => {
    const start = Date.now()
    const p = request.sendPromise('ua', automationFn, { url: url('/trickle'), timeout: 100 }, 'id-1')

    await expect(p).rejects.toMatchObject({ isRequestAbandoned: true, message: expect.stringContaining('no cancel arrived within 5100ms') })

    // the deadline is the timeout plus the grace period, never sooner
    expect(Date.now() - start).toBeGreaterThanOrEqual(5100)
    await waitFor(() => clientAborted['/trickle'] === true)
    expect(setCookieCalls()).toEqual([])
    expect(inFlight().size).toBe(0)
  }, 9000)
})
