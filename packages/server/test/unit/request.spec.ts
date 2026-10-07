import _ from 'lodash'
import dns from 'dns'
import http from 'http'
import Bluebird from 'bluebird'
import nock from 'nock'
import rp from '@cypress/request-promise'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import { Request } from '../../lib/request'

const request = new Request({ timeout: 100 })

const calledWithMatch = (spy: { mock: { calls: any[][] } }, partial: object) => {
  return spy.mock.calls.some(([opts]) => _.isMatch(opts, partial))
}

// `resolves()` sets the answer for every message except the two cookie messages.
const makeAutomationFn = () => {
  let defaultImpl: (() => unknown) | undefined

  const fn = vi.fn((msg: string) => {
    if (msg === 'set:cookie') {
      return Promise.resolve({})
    }

    if (msg === 'get:cookies') {
      return Promise.resolve([])
    }

    return defaultImpl?.()
  })

  const resolves = (value?: unknown) => {
    defaultImpl = () => Promise.resolve(value)
  }

  return Object.assign(fn, { resolves })
}

const testAttachingCookiesWith = async function (fn) {
  const set = vi.spyOn(request as any, 'setCookiesOnBrowser')
  const get = vi.spyOn(request as any, 'setRequestCookieHeader')

  nock('http://localhost:1234')
  .get('/')
  .reply(302, '', {
    'set-cookie': 'one=1',
    location: '/second',
  })
  .get('/second')
  .reply(302, '', {
    'set-cookie': 'two=2',
    location: '/third',
  })
  .get('/third')
  .reply(200, '', {
    'set-cookie': 'three=3',
  })

  await fn()

  expect({
    setCalls: set.mock.calls.map((args: any[]) => {
      return {
        currentUrl: args[1],
        setCookie: args[0].headers['set-cookie'],
      }
    }),
    getCalls: get.mock.calls.map((args) => {
      return {
        newUrl: _.get(args, '1'),
      }
    }),
  }).toMatchSnapshot()
}

describe('lib/request', () => {
  let automationFn: ReturnType<typeof makeAutomationFn>
  let originalResultOrder: ReturnType<typeof dns.getDefaultResultOrder>

  // chrome-remote-interface sets ipv4first process-wide when the server loads it.
  beforeAll(() => {
    originalResultOrder = dns.getDefaultResultOrder()
    dns.setDefaultResultOrder('ipv4first')
  })

  afterAll(() => {
    dns.setDefaultResultOrder(originalResultOrder)
  })

  beforeEach(() => {
    automationFn = makeAutomationFn()

    if (!nock.isActive()) {
      nock.activate()
    }

    nock.disableNetConnect()
    nock.enableNetConnect(/localhost/)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    nock.cleanAll()
    nock.enableNetConnect()
  })

  it('is defined', () => {
    expect(request).toBeTypeOf('object')
  })

  describe('#getDelayForRetry', () => {
    it('divides by 10 when delay >= 1000 and err.code = ECONNREFUSED', () => {
      const retryIntervals = [1, 2, 3, 4]
      const delaysRemaining = [0, 999, 1000, 2000]

      const err = {
        code: 'ECONNREFUSED',
      }

      const retryFn = vi.fn()

      retryIntervals.forEach(() => {
        // @ts-expect-error - getDelayForRetry is private
        return request.getDelayForRetry({
          err,
          retryFn,
          retryIntervals,
          delaysRemaining,
        })
      })

      expect(delaysRemaining).toHaveLength(0)

      expect(retryFn.mock.calls).toEqual([
        [{ delay: 0, attempt: 1 }],
        [{ delay: 999, attempt: 2 }],
        [{ delay: 100, attempt: 3 }],
        [{ delay: 200, attempt: 4 }],
      ])
    })

    it('does not divide by 10 when err.code != ECONNREFUSED', () => {
      const retryIntervals = [1, 2, 3, 4]
      const delaysRemaining = [2000, 2000, 2000, 2000]

      const err = {
        code: 'ECONNRESET',
      }

      const retryFn = vi.fn()

      // @ts-expect-error - getDelayForRetry is private
      request.getDelayForRetry({
        err,
        retryFn,
        retryIntervals,
        delaysRemaining,
      })

      expect(delaysRemaining).toHaveLength(3)

      expect(retryFn).toHaveBeenCalledWith({ delay: 2000, attempt: 1 })
    })

    it('calls onEnd when delaysRemaining is exhausted', () => {
      const retryIntervals = [1, 2, 3, 4]
      const delaysRemaining = []

      const retryFn = vi.fn()
      const onEnd = vi.fn()

      // @ts-expect-error - getDelayForRetry is private
      request.getDelayForRetry({
        onEnd,
        retryFn,
        retryIntervals,
        delaysRemaining,
      })

      expect(onEnd).toHaveBeenCalledWith()

      expect(retryFn).not.toHaveBeenCalled()
    })
  })

  describe('#setDefaults', () => {
    it('delaysRemaining to retryIntervals clone', () => {
      const retryIntervals = [1, 2, 3, 4]

      // @ts-expect-error - setDefaults is private
      const opts = Request.setDefaults({ retryIntervals })

      expect(opts.retryIntervals).toBe(retryIntervals)
      expect(opts.delaysRemaining).not.toBe(retryIntervals)

      expect(opts.delaysRemaining).toEqual(retryIntervals)
    })

    it('retryIntervals to [] by default', () => {
      // @ts-expect-error - setDefaults is private
      const opts = Request.setDefaults({})

      expect(opts.retryIntervals).toEqual([])
    })

    it('delaysRemaining can be overridden', () => {
      const delaysRemaining = [1]
      // @ts-expect-error - setDefaults is private
      const opts = Request.setDefaults({ delaysRemaining })

      expect(opts.delaysRemaining).toBe(delaysRemaining)
    })
  })

  describe('#normalizeResponse', () => {
    let push: Mock

    beforeEach(() => {
      push = vi.fn()
    })

    it('sets status to statusCode and deletes statusCode', () => {
      // @ts-expect-error - normalizeResponse is private
      expect(request.normalizeResponse(push, {
        statusCode: 404,
        request: {
          headers: { foo: 'bar' },
          body: 'body',
        },
      })).toEqual({
        status: 404,
        statusText: 'Not Found',
        isOkStatusCode: false,
        requestHeaders: { foo: 'bar' },
        requestBody: 'body',
      })

      expect(push).toHaveBeenCalledOnce()
    })

    it('picks out status body and headers', () => {
      // @ts-expect-error - normalizeResponse is private
      expect(request.normalizeResponse(push, {
        foo: 'bar',
        req: {},
        originalHeaders: {},
        headers: { 'Content-Length': 50 },
        body: '<html>foo</html>',
        statusCode: 200,
        request: {
          headers: { foo: 'bar' },
          body: 'body',
        },
      })).toEqual({
        body: '<html>foo</html>',
        headers: { 'Content-Length': 50 },
        status: 200,
        statusText: 'OK',
        isOkStatusCode: true,
        requestHeaders: { foo: 'bar' },
        requestBody: 'body',
      })

      expect(push).toHaveBeenCalledOnce()
    })
  })

  describe('#create', () => {
    let hits: number
    let srv: http.Server

    beforeEach(async () => {
      hits = 0

      srv = http.createServer((req, res) => {
        hits++

        switch (req.url) {
          case '/never-ends':
            res.writeHead(200)

            return res.write('foo\n')
          case '/econnreset':
            return req.socket.destroy()
          default:
            break
        }
      })

      await new Promise<void>((resolve) => srv.listen(9988, resolve))
    })

    afterEach(() => {
      srv.close()
    })

    describe('retries for streams', () => {
      it('does not retry on a timeout', async () => {
        // @ts-expect-error - setDefaults is private
        const opts = Request.setDefaults({
          url: 'http://localhost:9988/never-ends',
          timeout: 1000,
        })

        const stream = request.create(opts) as any

        let retries = 0

        stream.on('retry', () => {
          retries++
        })

        const p = Bluebird.fromCallback((cb) => {
          stream.on('error', cb)
        })

        await expect(p).rejects.toMatchObject({ code: 'ESOCKETTIMEDOUT' })

        expect(retries).toBe(0)
      })

      it('retries 4x on a connection reset', async () => {
        const opts = {
          url: 'http://localhost:9988/econnreset',
          retryIntervals: [0, 1, 2, 3],
          timeout: 1000,
        }

        const stream = request.create(opts) as any

        let retries = 0

        stream.on('retry', () => {
          retries++
        })

        const p = Bluebird.fromCallback((cb) => {
          stream.on('error', cb)
        })

        await expect(p).rejects.toMatchObject({ code: 'ECONNRESET' })

        expect(retries).toBe(4)
      })

      it('retries 4x on a NXDOMAIN (ENOTFOUND)', async () => {
        nock('http://will-never-exist.invalid.example.com')
        .get('/')
        .times(5)
        .replyWithError({ code: 'ENOTFOUND', message: 'getaddrinfo ENOTFOUND will-never-exist.invalid.example.com' })

        const opts = {
          url: 'http://will-never-exist.invalid.example.com',
          retryIntervals: [0, 1, 2, 3],
          timeout: 1000,
        }

        const stream = request.create(opts) as any

        let retries = 0

        stream.on('retry', () => {
          retries++
        })

        const p = Bluebird.fromCallback((cb) => {
          stream.on('error', cb)
        })

        await expect(p).rejects.toMatchObject({ code: 'ENOTFOUND' })

        expect(retries).toBe(4)
      })
    })

    describe('retries for promises', () => {
      it('does not retry on a timeout', () => {
        const opts = {
          url: 'http://localhost:9988/never-ends',
          timeout: 100,
        }

        return request.create(opts, true)
        .then(() => {
          throw new Error('should not reach')
        }).catch((err) => {
          expect(err.error.code).toBe('ESOCKETTIMEDOUT')

          expect(hits).toBe(1)
        })
      })

      it('retries 4x on a connection reset', () => {
        const opts = {
          url: 'http://localhost:9988/econnreset',
          retryIntervals: [0, 1, 2, 3],
          timeout: 250,
        }

        return request.create(opts, true)
        .then(() => {
          throw new Error('should not reach')
        }).catch((err) => {
          expect(err.error.code).toBe('ECONNRESET')

          expect(hits).toBe(5)
        })
      })
    })
  })

  describe('#sendPromise', () => {
    it('sets strictSSL=false', () => {
      const init = vi.spyOn(rp.Request.prototype, 'init')

      nock('http://www.github.com')
      .get('/foo')
      .reply(200, 'hello', {
        'Content-Type': 'text/html',
      })

      return request.sendPromise({}, automationFn, {
        url: 'http://www.github.com/foo',
        cookies: false,
      })
      .then(() => {
        expect(calledWithMatch(init, { strictSSL: false })).toBe(true)
      })
    })

    it('sets simple=false', () => {
      nock('http://www.github.com')
      .get('/foo')
      .reply(500, '')

      // should not bomb on 500
      // because simple = false
      return request.sendPromise({}, automationFn, {
        url: 'http://www.github.com/foo',
        cookies: false,
      })
    })

    it('sets resolveWithFullResponse=true', () => {
      nock('http://www.github.com')
      .get('/foo')
      .reply(200, 'hello', {
        'Content-Type': 'text/html',
      })

      return request.sendPromise(undefined, automationFn, {
        url: 'http://www.github.com/foo',
        cookies: false,
        body: 'foobarbaz',
      })
      .then((resp) => {
        expect(Object.keys(resp).sort()).toEqual(['status', 'body', 'headers', 'duration', 'isOkStatusCode', 'statusText', 'allRequestResponses', 'requestBody', 'requestHeaders'].sort())

        expect(resp.status).toBe(200)
        expect(resp.statusText).toBe('OK')
        expect(resp.body).toBe('hello')
        expect(resp.headers).toEqual({ 'content-type': 'text/html' })
        expect(resp.isOkStatusCode).toBe(true)
        expect(resp.requestBody).toBe('foobarbaz')
        expect(resp.requestHeaders).toEqual({
          'accept': '*/*',
          'accept-encoding': 'gzip, deflate',
          'connection': 'keep-alive',
          'content-length': 9,
          'host': 'www.github.com',
        })

        expect(resp.allRequestResponses).toEqual([
          {
            'Request Body': 'foobarbaz',
            'Request Headers': { 'accept': '*/*', 'accept-encoding': 'gzip, deflate', 'connection': 'keep-alive', 'content-length': 9, 'host': 'www.github.com' },
            'Request URL': 'http://www.github.com/foo',
            'Response Body': 'hello',
            'Response Headers': { 'content-type': 'text/html' },
            'Response Status': 200,
          },
        ])
      })
    })

    it('includes redirects', () => {
      automationFn.resolves()

      nock('http://www.github.com')
      .get('/dashboard')
      .reply(301, null, {
        'location': '/auth',
      })
      .get('/auth')
      .reply(302, null, {
        'location': '/login',
      })
      .get('/login')
      .reply(200, 'log in', {
        'Content-Type': 'text/html',
      })

      return request.sendPromise(undefined, automationFn, {
        url: 'http://www.github.com/dashboard',
        cookies: false,
      })
      .then((resp) => {
        expect(Object.keys(resp).sort()).toEqual(['status', 'body', 'headers', 'duration', 'isOkStatusCode', 'statusText', 'allRequestResponses', 'redirects', 'requestBody', 'requestHeaders'].sort())

        expect(resp.status).toBe(200)
        expect(resp.statusText).toBe('OK')
        expect(resp.body).toBe('log in')
        expect(resp.headers).toEqual({ 'content-type': 'text/html' })
        expect(resp.isOkStatusCode).toBe(true)
        expect(resp.requestBody).toBeUndefined()
        expect(resp.redirects).toEqual([
          '301: http://www.github.com/auth',
          '302: http://www.github.com/login',
        ])

        expect(resp.requestHeaders).toEqual({
          'accept': '*/*',
          'accept-encoding': 'gzip, deflate',
          'connection': 'keep-alive',
          'referer': 'http://www.github.com/auth',
          'host': 'www.github.com',
        })

        expect(resp.allRequestResponses).toEqual([
          {
            'Request Body': null,
            'Request Headers': { 'accept': '*/*', 'accept-encoding': 'gzip, deflate', 'connection': 'keep-alive', 'host': 'www.github.com' },
            'Request URL': 'http://www.github.com/dashboard',
            'Response Body': null,
            'Response Headers': { 'content-type': 'application/json', 'location': '/auth' },
            'Response Status': 301,
          }, {
            'Request Body': null,
            'Request Headers': { 'accept': '*/*', 'accept-encoding': 'gzip, deflate', 'connection': 'keep-alive', 'host': 'www.github.com', 'referer': 'http://www.github.com/dashboard' },
            'Request URL': 'http://www.github.com/auth',
            'Response Body': null,
            'Response Headers': { 'content-type': 'application/json', 'location': '/login' },
            'Response Status': 302,
          }, {
            'Request Body': null,
            'Request Headers': { 'accept': '*/*', 'accept-encoding': 'gzip, deflate', 'connection': 'keep-alive', 'host': 'www.github.com', 'referer': 'http://www.github.com/auth' },
            'Request URL': 'http://www.github.com/login',
            'Response Body': 'log in',
            'Response Headers': { 'content-type': 'text/html' },
            'Response Status': 200,
          },
        ])
      })
    })

    it('catches errors', () => {
      nock.enableNetConnect()

      const req = new Request({ timeout: 2000 })

      return req.sendPromise({}, automationFn, {
        url: 'http://localhost:1111/foo',
        cookies: false,
      })
      .then(() => {
        throw new Error('should have failed but didnt')
      }).catch((err) => {
        if (err.message === 'AggregateError') {
          expect(err.error.errors[0].message).toBe('connect ECONNREFUSED 127.0.0.1:1111')
        } else {
          expect(err.message).toBe('Error: connect ECONNREFUSED 127.0.0.1:1111')
        }
      })
    })

    it('parses response body as json if content-type application/json response headers', () => {
      nock('http://localhost:8080')
      .get('/status.json')
      .reply(200, JSON.stringify({ status: 'ok' }), {
        'Content-Type': 'application/json',
      })

      return request.sendPromise({}, automationFn, {
        url: 'http://localhost:8080/status.json',
        cookies: false,
      })
      .then((resp) => {
        expect(resp.body).toEqual({ status: 'ok' })
      })
    })

    it('parses response body as json if content-type application/vnd.api+json response headers', () => {
      nock('http://localhost:8080')
      .get('/status.json')
      .reply(200, JSON.stringify({ status: 'ok' }), {
        'Content-Type': 'application/vnd.api+json',
      })

      return request.sendPromise({}, automationFn, {
        url: 'http://localhost:8080/status.json',
        cookies: false,
      })
      .then((resp) => {
        expect(resp.body).toEqual({ status: 'ok' })
      })
    })

    it('revives from parsing bad json', () => {
      nock('http://localhost:8080')
      .get('/status.json')
      .reply(200, '{bad: \'json\'}', {
        'Content-Type': 'application/json',
      })

      return request.sendPromise({}, automationFn, {
        url: 'http://localhost:8080/status.json',
        cookies: false,
      })
      .then((resp) => {
        expect(resp.body).toBe('{bad: \'json\'}')
      })
    })

    it('sets duration on response', () => {
      nock('http://localhost:8080')
      .get('/foo')
      .delay(10)
      .reply(200, '123', {
        'Content-Type': 'text/plain',
      })

      return request.sendPromise({}, automationFn, {
        url: 'http://localhost:8080/foo',
        cookies: false,
      })
      .then((resp) => {
        expect(resp.duration).toBeTypeOf('number')

        expect(resp.duration).toBeGreaterThan(0)
      })
    })

    it('sends up user-agent headers', () => {
      nock('http://localhost:8080')
      .matchHeader('user-agent', 'foobarbaz')
      .get('/foo')
      .reply(200, 'derp')

      return request.sendPromise('foobarbaz', automationFn, {
        url: 'http://localhost:8080/foo',
        cookies: false,
      })
      .then((resp) => {
        expect(resp.body).toBe('derp')
      })
    })

    it('sends connection: keep-alive by default', () => {
      nock('http://localhost:8080')
      .matchHeader('connection', 'keep-alive')
      .get('/foo')
      .reply(200, 'it worked')

      return request.sendPromise({}, automationFn, {
        url: 'http://localhost:8080/foo',
        cookies: false,
      })
      .then((resp) => {
        expect(resp.body).toBe('it worked')
      })
    })

    it('lower cases headers', () => {
      nock('http://localhost:8080')
      .matchHeader('test', 'true')
      .get('/foo')
      .reply(200, 'derp')

      const headers = {}

      headers['user-agent'] = 'foobarbaz'

      return request.sendPromise(headers, automationFn, {
        url: 'http://localhost:8080/foo',
        cookies: false,
        headers: {
          'TEST': true,
        },
      })
      .then((resp) => {
        expect(resp.body).toBe('derp')
      })
    })

    it('allows overriding user-agent in headers', () => {
      nock('http://localhost:8080')
      .matchHeader('user-agent', 'custom-agent')
      .get('/foo')
      .reply(200, 'derp')

      const headers = { 'user-agent': 'test' }

      return request.sendPromise(headers, automationFn, {
        url: 'http://localhost:8080/foo',
        cookies: false,
        headers: {
          'User-Agent': 'custom-agent',
        },
      })
      .then((resp) => {
        expect(resp.body).toBe('derp')
      })
    })

    describe('accept header', () => {
      it('sets to */* by default', () => {
        nock('http://localhost:8080')
        .matchHeader('accept', '*/*')
        .get('/headers')
        .reply(200)

        return request.sendPromise({}, automationFn, {
          url: 'http://localhost:8080/headers',
          cookies: false,
        })
        .then((resp) => {
          expect(resp.status).toBe(200)
        })
      })

      it('can override accept header', () => {
        nock('http://localhost:8080')
        .matchHeader('accept', 'text/html')
        .get('/headers')
        .reply(200)

        return request.sendPromise({}, automationFn, {
          url: 'http://localhost:8080/headers',
          cookies: false,
          headers: {
            accept: 'text/html',
          },
        })
        .then((resp) => {
          expect(resp.status).toBe(200)
        })
      })

      it('can override Accept header', () => {
        nock('http://localhost:8080')
        .matchHeader('accept', 'text/plain')
        .get('/headers')
        .reply(200)

        return request.sendPromise({}, automationFn, {
          url: 'http://localhost:8080/headers',
          cookies: false,
          headers: {
            Accept: 'text/plain',
          },
        })
        .then((resp) => {
          expect(resp.status).toBe(200)
        })
      })
    })

    describe('qs', () => {
      it('can accept qs', () => {
        nock('http://localhost:8080')
        .get('/foo?bar=baz&q=1')
        .reply(200)

        return request.sendPromise({}, automationFn, {
          url: 'http://localhost:8080/foo',
          cookies: false,
          qs: {
            bar: 'baz',
            q: 1,
          },
        })
        .then((resp) => {
          expect(resp.status).toBe(200)
        })
      })
    })

    describe('followRedirect', () => {
      beforeEach(() => {
        automationFn.resolves()
      })

      it('by default follow redirects', () => {
        nock('http://localhost:8080')
        .get('/dashboard')
        .reply(302, '', {
          location: 'http://localhost:8080/login',
        })
        .get('/login')
        .reply(200, 'login')

        return request.sendPromise({}, automationFn, {
          url: 'http://localhost:8080/dashboard',
          cookies: false,
          followRedirect: true,
        })
        .then((resp) => {
          expect(resp.status).toBe(200)
          expect(resp.body).toBe('login')

          expect(resp).not.toHaveProperty('redirectedToUrl')
        })
      })

      it('follows non-GET redirects by default', () => {
        nock('http://localhost:8080')
        .post('/login')
        .reply(302, '', {
          location: 'http://localhost:8080/dashboard',
        })
        .get('/dashboard')
        .reply(200, 'dashboard')

        return request.sendPromise({}, automationFn, {
          method: 'POST',
          url: 'http://localhost:8080/login',
          cookies: false,
        })
        .then((resp) => {
          expect(resp.status).toBe(200)
          expect(resp.body).toBe('dashboard')

          expect(resp).not.toHaveProperty('redirectedToUrl')
        })
      })

      it('can turn off following redirects', () => {
        nock('http://localhost:8080')
        .get('/dashboard')
        .reply(302, '', {
          location: 'http://localhost:8080/login',
        })
        .get('/login')
        .reply(200, 'login')

        return request.sendPromise({}, automationFn, {
          url: 'http://localhost:8080/dashboard',
          cookies: false,
          followRedirect: false,
        })
        .then((resp) => {
          expect(resp.status).toBe(302)
          expect(resp.body).toBe('')

          expect(resp.redirectedToUrl).toBe('http://localhost:8080/login')
        })
      })

      it('resolves redirectedToUrl on relative redirects', () => {
        nock('http://localhost:8080')
        .get('/dashboard')
        .reply(302, '', {
          location: '/login', // absolute-relative pathname
        })
        .get('/login')
        .reply(200, 'login')

        return request.sendPromise({}, automationFn, {
          url: 'http://localhost:8080/dashboard',
          cookies: false,
          followRedirect: false,
        })
        .then((resp) => {
          expect(resp.status).toBe(302)

          expect(resp.redirectedToUrl).toBe('http://localhost:8080/login')
        })
      })

      it('resolves redirectedToUrl to another domain', () => {
        nock('http://localhost:8080')
        .get('/dashboard')
        .reply(301, '', {
          location: 'https://www.google.com/login',
        })
        .get('/login')
        .reply(200, 'login')

        return request.sendPromise({}, automationFn, {
          url: 'http://localhost:8080/dashboard',
          cookies: false,
          followRedirect: false,
        })
        .then((resp) => {
          expect(resp.status).toBe(301)

          expect(resp.redirectedToUrl).toBe('https://www.google.com/login')
        })
      })

      it('does not included redirectedToUrl when following redirects', () => {
        nock('http://localhost:8080')
        .get('/dashboard')
        .reply(302, '', {
          location: 'http://localhost:8080/login',
        })
        .get('/login')
        .reply(200, 'login')

        return request.sendPromise({}, automationFn, {
          url: 'http://localhost:8080/dashboard',
          cookies: false,
        })
        .then((resp) => {
          expect(resp.status).toBe(200)

          expect(resp).not.toHaveProperty('redirectedToUrl')
        })
      })

      it('gets + attaches the cookies at each redirect', () => {
        return testAttachingCookiesWith(() => {
          return request.sendPromise({}, automationFn, {
            url: 'http://localhost:1234/',
          })
        })
      })
    })

    describe('form=true', () => {
      beforeEach(() => {
        nock('http://localhost:8080')
        .matchHeader('Content-Type', 'application/x-www-form-urlencoded')
        .post('/login', 'foo=bar&baz=quux')
        .reply(200, '<html></html>')
      })

      it('takes converts body to x-www-form-urlencoded and sets header', () => {
        return request.sendPromise({}, automationFn, {
          url: 'http://localhost:8080/login',
          method: 'POST',
          cookies: false,
          form: true,
          body: {
            foo: 'bar',
            baz: 'quux',
          },
        })
        .then((resp) => {
          expect(resp.status).toBe(200)

          expect(resp.body).toBe('<html></html>')
        })
      })

      it('does not send body', () => {
        const init = vi.spyOn(rp.Request.prototype, 'init')

        const body = {
          foo: 'bar',
          baz: 'quux',
        }

        return request.sendPromise({}, automationFn, {
          url: 'http://localhost:8080/login',
          method: 'POST',
          cookies: false,
          form: true,
          json: true,
          body,
        })
        .then((resp) => {
          expect(resp.status).toBe(200)
          expect(resp.body).toBe('<html></html>')

          expect(calledWithMatch(init, { body })).toBe(false)
        })
      })

      it('does not set json=true', () => {
        const init = vi.spyOn(rp.Request.prototype, 'init')

        return request.sendPromise({}, automationFn, {
          url: 'http://localhost:8080/login',
          method: 'POST',
          cookies: false,
          form: true,
          json: true,
          body: {
            foo: 'bar',
            baz: 'quux',
          },
        })
        .then((resp) => {
          expect(resp.status).toBe(200)
          expect(resp.body).toBe('<html></html>')

          expect(calledWithMatch(init, { json: true })).toBe(false)
        })
      })
    })

    // https://github.com/cypress-io/cypress/issues/28789
    describe('json=true', () => {
      beforeEach(() => {
        nock('http://localhost:8080')
        .matchHeader('Content-Type', 'application/json')
        .post('/login')
        .reply(200, '<html></html>')
      })

      it('does not modify regular JSON objects', () => {
        const init = vi.spyOn(rp.Request.prototype, 'init')
        const body = {
          foo: 'bar',
        }

        return request.sendPromise({}, automationFn, {
          url: 'http://localhost:8080/login',
          method: 'POST',
          cookies: false,
          json: true,
          body,
        })
        .then(() => {
          expect(calledWithMatch(init, { body })).toBe(true)
        })
      })

      it('converts boolean JSON literals to strings', () => {
        const init = vi.spyOn(rp.Request.prototype, 'init')

        return request.sendPromise({}, automationFn, {
          url: 'http://localhost:8080/login',
          method: 'POST',
          cookies: false,
          json: true,
          body: true,
        })
        .then(() => {
          expect(calledWithMatch(init, { body: 'true' })).toBe(true)
        })
      })

      it('converts null JSON literals to \'null\'', () => {
        const init = vi.spyOn(rp.Request.prototype, 'init')

        return request.sendPromise({}, automationFn, {
          url: 'http://localhost:8080/login',
          method: 'POST',
          cookies: false,
          json: true,
          body: null,
        })
        .then(() => {
          expect(calledWithMatch(init, { body: 'null' })).toBe(true)
        })
      })
    })

    describe('bad headers', () => {
      let srv: http.Server

      beforeEach(async () => {
        srv = http.createServer((req, res) => {
          res.writeHead(200)

          res.end()
        })

        await new Promise<void>((resolve) => srv.listen(9988, resolve))
      })

      afterEach(() => {
        srv.close()
      })

      it('recovers from bad headers', () => {
        return request.sendPromise({}, automationFn, {
          url: 'http://localhost:9988/foo',
          cookies: false,
          headers: {
            'x-text': 'אבגד',
          },
        })
        .then(() => {
          throw new Error('should have failed')
        }).catch((err) => {
          expect(err.message).toBe('TypeError [ERR_INVALID_CHAR]: Invalid character in header content ["x-text"]')
        })
      })

      it('handles weird content in the body just fine', () => {
        return request.sendPromise({}, automationFn, {
          url: 'http://localhost:9988/foo',
          cookies: false,
          json: true,
          body: {
            'x-text': 'אבגד',
          },
        })
      })
    })
  })

  describe('#sendStream', () => {
    it('allows overriding user-agent in headers', () => {
      nock('http://localhost:8080')
      .matchHeader('user-agent', 'custom-agent')
      .get('/foo')
      .reply(200, 'derp')

      vi.spyOn(request, 'create')
      automationFn.resolves({})

      const headers = { 'user-agent': 'test' }

      const options = {
        url: 'http://localhost:8080/foo',
        cookies: false,
        headers: {
          'user-agent': 'custom-agent',
        },
      }

      return request.sendStream(headers, automationFn, options)
      .then((beginFn) => {
        const req = beginFn()

        expect(request.create).toHaveBeenCalledOnce()

        expect(request.create).toHaveBeenCalledWith(options)

        // afterEach's nock.cleanAll() would otherwise run before the request is sent
        return new Promise((resolve, reject) => {
          req.on('response', resolve)

          req.on('error', reject)
        })
      })
    })

    it('gets + attaches the cookies at each redirect', () => {
      return testAttachingCookiesWith(() => {
        return request.sendStream({}, automationFn, {
          url: 'http://localhost:1234/',
          followRedirect: _.stubTrue,
        })
        .then((fn) => {
          const req = fn()

          return new Promise((resolve, reject) => {
            req.on('response', resolve)

            req.on('error', reject)
          })
        })
      })
    })
  })
})
