import * as http from 'http'
import * as https from 'https'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import * as express from 'express'
import * as Promise from 'bluebird'
import * as request from 'request-promise'
import DebuggingProxy = require('debugging-proxy')
// @ts-ignore
import Ca = require('../../../https-proxy/lib/ca')
import { expect } from 'chai'
import { CombinedAgent } from '../../lib/util/agent'

const PROXY_PORT = 31215
const HTTP_PORT = 31216
const HTTPS_PORT = 31217

describe('lib/util/agent', function() {
  before(function() {
    // generate some localhost certs for testing https servers
    return Ca.create(fs.mkdtempSync(path.join(os.tmpdir(), 'cy-test-')))
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

      this.httpServer = http.createServer(app)

      this.httpsServer = https.createServer(this.https, app)

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
      proxyUrl: `http://localhost:8118`,
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
  ].slice(1,2).map((testCase) => {
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
          if (!this.debugProxy) {
            return
          }
          expect(this.debugProxy.requests[0]).to.include({
            url: `http://localhost:${HTTP_PORT}/get`
          })
        })
      })

      it('HTTPS pages can be loaded', function() {
        return this.request({
          url: `https://localhost:${HTTPS_PORT}/get`
        }).then(body => {
          expect(body).to.eq('It worked!')
          if (!this.debugProxy) {
            return
          }
          expect(this.debugProxy.requests[0]).to.include({
            ssl: true,
            hostname: 'localhost',
            port: HTTPS_PORT
          })
        })
      })

      it('websocket connections can be established and used', function() {

      })
    })
  })

  // ;[
  //   {
  //     name: 'With an unreachable HTTP upstream',
  //     proxyUrl: 'http://192.0.2.1:11111'
  //   },
  //   {
  //     name: 'With an unreachable HTTPS upstream',
  //     proxyUrl: 'https://192.0.2.1:11111'
  //   }
  // ].map(testCase => {
  //   context(testCase.name, function() {
  //     beforeEach(function() {
  //       this.oldEnv = Object.assign({}, process.env)
  //       process.env.HTTP_PROXY = process.env.HTTPS_PROXY = testCase.proxyUrl
  //       process.env.NO_PROXY = ''

  //       this.agent = new CombinedAgent()

  //       this.request = request.defaults({
  //         proxy: null,
  //         agent: this.agent
  //       })
  //     })

  //     afterEach(function() {
  //       Object.assign(process.env, this.oldEnv)
  //     })

  //     it('fails gracefully on HTTP request', function() {
  //       return this.request({
  //         url: 'http://example.com',
  //         timeout: 200
  //       }).catch((err) => {
  //         expect(err.message).to.include('ETIMEDOUT')
  //       })
  //     })

  //     it('fails gracefully on HTTPS request', function() {
  //       return this.request({
  //         url: 'https://example.com',
  //         timeout: 1000
  //       }).catch((err) => {
  //         expect(err.message).to.include('ETIMEDOUT')
  //       })
  //     })
  //   })
  // })
})
