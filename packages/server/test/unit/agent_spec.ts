import * as http from 'http'
import * as https from 'https'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import DebuggingProxy = require('debugging-proxy')
import { expect } from 'chai'
import * as express from 'express'
import * as Promise from 'bluebird'
import * as request from 'request-promise'
// @ts-ignore
import CA = require('../../../https-proxy/lib/ca')
import { CombinedAgent } from '../../lib/util/agent'
import * as Io from '@packages/socket'

const PROXY_PORT = 31000
const HTTP_PORT = 31080
const HTTPS_PORT = 31443

describe('lib/util/agent', function() {
  before(function() {
    // generate some localhost certs for testing https servers
    return CA.create(fs.mkdtempSync(path.join(os.tmpdir(), 'cy-test-')))
    .then(ca => ca.generateServerCertificateKeys('localhost'))
    .spread((cert, key) => {
      this.https = {
        cert, key
      }
    })
    .then(() => {
      // set up an http and an https server to reach
      const app = express()

      app.get('/get', (req, res) => {
        res.send('It worked!')
      })

      app.get('/empty-response', (req, res) => {
        // ERR_EMPTY_RESPONSE in Chrome
        setTimeout(() => res.connection.destroy(), 100)
      })

      this.httpServer = http.createServer(app)
      this.wsServer = Io.server(this.httpServer)

      this.httpsServer = https.createServer(this.https, app)
      this.wssServer = Io.server(this.httpsServer)

      ;[this.wsServer, this.wssServer].map(ws => {
        ws.on('connection', function(socket) {
          socket.send('It worked!')
        })
      })

      return Promise.all([
        new Promise((resolve) => this.httpServer.listen(HTTP_PORT, resolve)),
        new Promise((resolve) => this.httpsServer.listen(HTTPS_PORT, resolve))
      ])
    })
  })

  after(function() {
    this.httpsServer.close()
    this.httpServer.close()
  })

  ;[
    {
      name: 'With no upstream',
    },
    {
      name: 'With an HTTP upstream',
      proxyUrl: `http://localhost:${PROXY_PORT}`,
    },
    {
      name: 'With an HTTPS upstream',
      proxyUrl: `https://localhost:${PROXY_PORT}`,
      httpsProxy: true,
    },
    {
      name: 'With an HTTP upstream requiring auth',
      proxyUrl: `http://foo:bar@localhost:${PROXY_PORT}`,
      proxyAuth: true,
    },
    {
      name: 'With an HTTPS upstream requiring auth',
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

        this.agent = new CombinedAgent()

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
            options.https = this.https
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
        }).catch(err => {
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
        }).catch(err => {
          expect(err.message).to.eq('Error: socket hang up')
        })
      })

      it('HTTP websocket connections can be established and used', function() {
        return new Promise((resolve) => {
          Io.client(`http://localhost:${HTTP_PORT}`, {
            agent: this.agent,
            transports: ['websocket']
          }).on('message', (msg) => {
            expect(msg).to.eq('It worked!')
            if (this.debugProxy) {
              expect(this.debugProxy.requests[0].ws).to.be.true
              expect(this.debugProxy.requests[0].url).to.include('http://localhost:31080')
            }
            resolve()
          })
        })
      })

      it('HTTPS websocket connections can be established and used', function() {
        return new Promise((resolve) => {
          Io.client(`https://localhost:${HTTPS_PORT}`, {
            agent: this.agent,
            transports: ['websocket']
          }).on('message', (msg) => {
            expect(msg).to.eq('It worked!')
            if (this.debugProxy) {
              expect(this.debugProxy.requests[0]).to.include({
                url: 'localhost:31443'
              })
            }
            resolve()
          })
        })
      })
    })
  })

  ;[
    {
      name: 'With an unreachable HTTP upstream',
      proxyUrl: 'http://192.0.2.1:11111'
    },
    {
      name: 'With an unreachable HTTPS upstream',
      proxyUrl: 'https://192.0.2.1:11111'
    }
  ].slice().map(testCase => {
    context(testCase.name, function() {
      beforeEach(function() {
        this.oldEnv = Object.assign({}, process.env)
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
        process.env.HTTP_PROXY = process.env.HTTPS_PROXY = testCase.proxyUrl
        process.env.NO_PROXY = ''

        this.agent = new CombinedAgent()

        this.request = request.defaults({
          proxy: null,
          agent: this.agent
        })
      })

      afterEach(function() {
        Object.assign(process.env, this.oldEnv)
      })

      it('fails gracefully on HTTP request', function() {
        return this.request({
          url: `http://localhost:${HTTP_PORT}`,
          timeout: 50
        }).catch((err) => {
          expect(err.message).to.include('ETIMEDOUT')
        })
      })

      // request library timeouts don't work on HTTPS requests
      it.skip('fails gracefully on HTTPS request', function() {
        return new Promise((resolve) => {
          // @ts-ignore
          const req = https.request({
            port: HTTPS_PORT,
            agent: this.agent,
            timeout: 50
          })

          req.on('error', (err) => {
            expect(err.message).to.include('ETIMEDOUT')
            resolve()
          })

          req.flushHeaders()
          req.end() //send
        })
      })
    })
  })
})
