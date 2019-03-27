import * as url from 'url'
import * as net from 'net'
import * as tls from 'tls'
import * as chai from 'chai'
import DebuggingProxy = require('debugging-proxy')
import * as Promise from 'bluebird'
import * as request from 'request-promise'
import * as sinon from 'sinon'
import * as sinonChai from 'sinon-chai'
import { agent } from '../..'
import * as Io from '@packages/socket'
import { Servers } from '../support/servers'

const expect = chai.expect
chai.use(sinonChai)

const PROXY_PORT = 31000
const HTTP_PORT = 31080
const HTTPS_PORT = 31443

describe('lib/agent', function() {
  afterEach(() => {
    sinon.restore()
  })

  context('can make requests', function() {
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
          this.oldEnv = Object.assign({}, process.env)
          process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

          if (testCase.proxyUrl) {
            process.env.HTTP_PROXY = process.env.HTTPS_PROXY = testCase.proxyUrl
            process.env.NO_PROXY = ''
          }

          this.agent = new agent.CombinedAgent()

          this.request = request.defaults({
            proxy: null,
            strictSSL: false,
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
          process.env = this.oldEnv

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
  })

  context("#_buildConnectReqHead", function() {
    it('builds the correct request', function() {
      const head = agent._buildConnectReqHead('foo.bar', '1234', {})
      expect(head).to.eq([
        'CONNECT foo.bar:1234 HTTP/1.1',
        'Host: foo.bar:1234',
        '', ''
      ].join('\r\n'))
    })

    it('can do Proxy-Authorization', function() {
      const head = agent._buildConnectReqHead('foo.bar', '1234', {
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

  context("#_createProxySock", function() {
    it("creates a `net` socket for an http url", function() {
      sinon.stub(net, 'connect')
      const proxy = url.parse('http://foo.bar:1234')
      agent._createProxySock(proxy)
      expect(net.connect).to.be.calledWith(1234, 'foo.bar')
    })

    it("creates a `tls` socket for an https url", function() {
      sinon.stub(tls, 'connect')
      const proxy = url.parse('https://foo.bar:1234')
      agent._createProxySock(proxy)
      expect(tls.connect).to.be.calledWith(1234, 'foo.bar')
    })

    it("throws on unsupported proxy protocol", function() {
      const proxy = url.parse('socksv5://foo.bar:1234')
      try {
        agent._createProxySock(proxy)
        throw new Error("Shouldn't be reached")
      } catch (e) {
        expect(e.message).to.eq("Unsupported proxy protocol: socksv5:")
      }
    })
  })

  context("#_isResponseStatusCode200", function() {
    it("matches a 200 OK response correctly", function() {
      const result = agent._isResponseStatusCode200("HTTP/1.1 200 Connection established")
      expect(result).to.be.true
    })

    it("matches a 500 error response correctly", function() {
      const result = agent._isResponseStatusCode200("HTTP/1.1 500 Internal Server Error")
      expect(result).to.be.false
    })
  })
})
