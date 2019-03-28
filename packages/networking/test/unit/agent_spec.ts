import * as http from 'http'
import * as https from 'https'
import * as net from 'net'
import * as tls from 'tls'
import * as url from 'url'
import * as chai from 'chai'
import DebuggingProxy = require('debugging-proxy')
import * as Promise from 'bluebird'
import * as request from 'request-promise'
import * as sinon from 'sinon'
import * as sinonChai from 'sinon-chai'
import {
  CombinedAgent,
  _buildConnectReqHead,
  _createProxySock,
  isRequestHttps,
  isResponseStatusCode200,
  _regenerateRequestHead
} from '../../lib/agent'
import * as Io from '@packages/socket'
import { Servers, AsyncServer } from '../support/servers'

const expect = chai.expect
chai.use(sinonChai)

const PROXY_PORT = 31000
const HTTP_PORT = 31080
const HTTPS_PORT = 31443

describe('lib/agent', function() {
  beforeEach(function() {
    this.oldEnv = Object.assign({}, process.env)
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
  })

  afterEach(function() {
    process.env = this.oldEnv
    sinon.restore()
  })

  context('CombinedAgent', function() {
    before(function() {
      this.servers = new Servers()
      return this.servers.start(HTTP_PORT, HTTPS_PORT)
    })

    after(function() {
      return this.servers.stop()
    })

    ;[
      {
        name: 'with no upstream',
      },
      {
        name: 'with an HTTP upstream',
        proxyUrl: `http://localhost:${PROXY_PORT}`,
      },
      {
        name: 'with an HTTPS upstream',
        proxyUrl: `https://localhost:${PROXY_PORT}`,
        httpsProxy: true,
      },
      {
        name: 'with an HTTP upstream requiring auth',
        proxyUrl: `http://foo:bar@localhost:${PROXY_PORT}`,
        proxyAuth: true,
      },
      {
        name: 'with an HTTPS upstream requiring auth',
        proxyUrl: `https://foo:bar@localhost:${PROXY_PORT}`,
        httpsProxy: true,
        proxyAuth: true
      }
    ].slice().map((testCase) => {
      context(testCase.name, function() {
        beforeEach(function() {
          if (testCase.proxyUrl) {
            process.env.HTTP_PROXY = process.env.HTTPS_PROXY = testCase.proxyUrl
            process.env.NO_PROXY = ''
          }

          this.agent = new CombinedAgent()

          this.request = request.defaults({
            proxy: null,
            agent: this.agent
          })

          if (testCase.proxyUrl) {
            let options: any = {
              keepRequests: true,
              https: false,
              auth: false
            }

            if (testCase.httpsProxy) {
              options.https = this.servers.https
            }

            if (testCase.proxyAuth) {
              options.auth = {
                username: 'foo',
                password: 'bar'
              }
            }

            this.debugProxy = new DebuggingProxy(options)
            return this.debugProxy.start(PROXY_PORT)
          }
        })

        afterEach(function() {
          if (testCase.proxyUrl) {
            this.debugProxy.stop()
          }
        })

        it('HTTP pages can be loaded', function() {
          return this.request({
            url: `http://localhost:${HTTP_PORT}/get`,
          }).then(body => {
            expect(body).to.eq('It worked!')
            if (this.debugProxy) {
              expect(this.debugProxy.requests[0]).to.include({
                url: `http://localhost:${HTTP_PORT}/get`
              })
            }
          })
        })

        it('HTTPS pages can be loaded', function() {
          return this.request({
            url: `https://localhost:${HTTPS_PORT}/get`
          }).then(body => {
            expect(body).to.eq('It worked!')
            if (this.debugProxy) {
              expect(this.debugProxy.requests[0]).to.include({
                https: true,
                url: `localhost:${HTTPS_PORT}`
              })
            }
          })
        })

        it('HTTP errors are catchable', function() {
          return this.request({
            url: `http://localhost:${HTTP_PORT}/empty-response`,
          })
          .then(() => {
            throw new Error("Shouldn't reach this")
          })
          .catch(err => {
            if (this.debugProxy) {
              expect(this.debugProxy.requests[0]).to.include({
                url: `http://localhost:${HTTP_PORT}/empty-response`
              })
              expect(err.statusCode).to.eq(502)
            } else {
              expect(err.message).to.eq('Error: socket hang up')
            }
          })
        })

        it('HTTPS errors are catchable', function() {
          return this.request({
            url: `https://localhost:${HTTPS_PORT}/empty-response`,
          })
          .then(() => {
            throw new Error("Shouldn't reach this")
          })
          .catch(err => {
            expect(err.message).to.eq('Error: socket hang up')
          })
        })

        it('HTTP websocket connections can be established and used', function() {
          return new Promise((resolve) => {
            Io.client(`http://localhost:${HTTP_PORT}`, {
              agent: this.agent,
              transports: ['websocket']
            }).on('message', resolve)
          })
          .then(msg => {
            expect(msg).to.eq('It worked!')
            if (this.debugProxy) {
              expect(this.debugProxy.requests[0].ws).to.be.true
              expect(this.debugProxy.requests[0].url).to.include('http://localhost:31080')
            }
          })
        })

        it('HTTPS websocket connections can be established and used', function() {
          return new Promise((resolve) => {
            Io.client(`https://localhost:${HTTPS_PORT}`, {
              agent: this.agent,
              transports: ['websocket']
            }).on('message', resolve)
          })
          .then(msg => {
            expect(msg).to.eq('It worked!')
            if (this.debugProxy) {
              expect(this.debugProxy.requests[0]).to.include({
                url: 'localhost:31443'
              })
            }
          })
        })
      })
    })

    context('HttpsAgent', function() {
      it("#createProxiedConnection calls to super for caching, TLS-ifying", function() {
        const combinedAgent = new CombinedAgent()
        const spy = sinon.spy(https.Agent.prototype, 'createConnection')

        const proxy = new DebuggingProxy()
        const proxyPort = PROXY_PORT + 1

        process.env.HTTP_PROXY = process.env.HTTPS_PROXY = `http://localhost:${proxyPort}`
        process.env.NO_PROXY = ''

        return proxy.start(proxyPort)
        .then(() => {
          return request({
            url: `https://localhost:${HTTPS_PORT}/get`,
            agent: <any>combinedAgent,
            proxy: null
          })
        })
        .then(() => {
          const options = spy.getCall(0).args[0]
          const session = combinedAgent.httpsAgent._sessionCache.map[options._agentKey]
          expect(spy).to.be.calledOnce
          expect(combinedAgent.httpsAgent._sessionCache.list).to.have.length(1)
          expect(session).to.not.be.undefined

          return proxy.stop()
        })
      })

      it("#createProxiedConnection throws when connection is accepted then closed", function() {
        const combinedAgent = new CombinedAgent()

        const proxy = Promise.promisifyAll(
          net.createServer((socket) => {
            socket.end()
          })
        ) as net.Server & AsyncServer

        const proxyPort = PROXY_PORT + 2

        process.env.HTTP_PROXY = process.env.HTTPS_PROXY = `http://localhost:${proxyPort}`
        process.env.NO_PROXY = ''

        return proxy.listenAsync(proxyPort)
        .then(() => {
          return request({
            url: `https://localhost:${HTTPS_PORT}/get`,
            agent: <any>combinedAgent,
            proxy: null
          })
        })
        .then(() => {
          throw new Error('should not succeed')
        })
        .catch((e) => {
          expect(e.message).to.eq('Error: Connection closed while sending request to upstream proxy')

          return proxy.closeAsync()
        })
      })
    })
  })

  context("._buildConnectReqHead", function() {
    it('builds the correct request', function() {
      const head = _buildConnectReqHead('foo.bar', '1234', {})
      expect(head).to.eq([
        'CONNECT foo.bar:1234 HTTP/1.1',
        'Host: foo.bar:1234',
        '', ''
      ].join('\r\n'))
    })

    it('can do Proxy-Authorization', function() {
      const head = _buildConnectReqHead('foo.bar', '1234', {
        auth: 'baz:quux'
      })
      expect(head).to.eq([
        'CONNECT foo.bar:1234 HTTP/1.1',
        'Host: foo.bar:1234',
        'Proxy-Authorization: basic YmF6OnF1dXg=',
        '', ''
      ].join('\r\n'))
    })
  })

  context("._createProxySock", function() {
    it("creates a `net` socket for an http url", function() {
      sinon.stub(net, 'connect')
      const proxy = url.parse('http://foo.bar:1234')
      _createProxySock(proxy)
      expect(net.connect).to.be.calledWith(1234, 'foo.bar')
    })

    it("creates a `tls` socket for an https url", function() {
      sinon.stub(tls, 'connect')
      const proxy = url.parse('https://foo.bar:1234')
      _createProxySock(proxy)
      expect(tls.connect).to.be.calledWith(1234, 'foo.bar')
    })

    it("throws on unsupported proxy protocol", function() {
      const proxy = url.parse('socksv5://foo.bar:1234')
      try {
        _createProxySock(proxy)
        throw new Error("Shouldn't be reached")
      } catch (e) {
        expect(e.message).to.eq("Unsupported proxy protocol: socksv5:")
      }
    })
  })

  context(".isRequestHttps", function() {
    [
      {
        protocol: 'http',
        agent: http.globalAgent,
        expect: false
      },
      {
        protocol: 'https',
        agent: https.globalAgent,
        expect: true
      }
    ].map((testCase) => {
      it(`detects correctly from ${testCase.protocol} requests`, () => {
        const spy = sinon.spy(testCase.agent, 'addRequest')

        return request({
          url: `${testCase.protocol}://foo.bar.baz.invalid`,
          agent: testCase.agent
        })
        .then(() => {
          throw new Error('Shouldn\'t succeed')
        })
        .catch((e) => {
          const requestOptions = spy.getCall(0).args[1]
          expect(isRequestHttps(requestOptions)).to.equal(testCase.expect)
        })
      })

      it(`detects correctly from ${testCase.protocol} websocket requests`, () => {
        const spy = sinon.spy(testCase.agent, 'addRequest')

        return new Promise((resolve, reject) => {
          Io.client(`${testCase.protocol}://foo.bar.baz.invalid`, {
            agent: <any>testCase.agent,
            transports: ['websocket'],
            timeout: 1
          })
          .on('message', reject)
          .on('connect_error', resolve)
        })
        .then(() => {
          const requestOptions = spy.getCall(0).args[1]
          expect(isRequestHttps(requestOptions)).to.equal(testCase.expect)
        })
      })
    })
  })

  context(".isResponseStatusCode200", function() {
    it("matches a 200 OK response correctly", function() {
      const result = isResponseStatusCode200("HTTP/1.1 200 Connection established")
      expect(result).to.be.true
    })

    it("matches a 500 error response correctly", function() {
      const result = isResponseStatusCode200("HTTP/1.1 500 Internal Server Error")
      expect(result).to.be.false
    })
  })

  context("._regenerateRequestHead", function() {
    it("regenerates changed request head", () => {
      const spy = sinon.spy(http.globalAgent, 'createSocket')
      return request({
        url: 'http://foo.bar.baz.invalid',
        agent: http.globalAgent
      })
      .then(() => {
        throw new Error('this should fail')
      })
      .catch(() => {
        const req = spy.getCall(0).args[0]
        expect(req._header).to.equal([
          'GET / HTTP/1.1',
          'host: foo.bar.baz.invalid',
          'Connection: close',
          '', ''
        ].join('\r\n'))
        // now change some stuff, regen, and expect it to work
        delete req._header
        req.path = 'http://quuz.quux.invalid/abc?def=123'
        req.setHeader('Host', 'foo.fleem.invalid')
        req.setHeader('bing', 'bang')
        _regenerateRequestHead(req)
        expect(req._header).to.equal([
          'GET http://quuz.quux.invalid/abc?def=123 HTTP/1.1',
          'Host: foo.fleem.invalid',
          'bing: bang',
          'Connection: close',
          '', ''
        ].join('\r\n'))
      })
    })
  })
})
