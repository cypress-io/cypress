import Bluebird from 'bluebird'
import chai from 'chai'
import http from 'http'
import https from 'https'
import net, { type ListenOptions } from 'net'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import tls from 'tls'
import url from 'url'
import DebuggingProxy from '@cypress/debugging-proxy'
import Request from '@cypress/request-promise'

import * as socketIo from '@packages/socket/lib/browser'
import {
  buildConnectReqHead,
  createProxySock,
  isRequestHttps,
  isResponseStatusCode200,
  regenerateRequestHead,
  CombinedAgent,
  clientCertificateStore,
  _resetBaseCaOptionsPromise,
  getFirstWorkingFamily,
} from '../../lib/agent'
import { allowDestroy } from '../../lib/allow-destroy'
import { AsyncServer, Servers } from '../support/servers'
import { UrlClientCertificates, ClientCertificates, PemKey } from '../../lib/client-certificates'
import { pki } from 'node-forge'
import fetch from 'cross-fetch'
import os from 'os'
import path from 'path'
import fs from 'fs'

const expect = chai.expect

chai.use(sinonChai)

const PROXY_PORT = 31000
const HTTP_PORT = 31080
const HTTPS_PORT = 443

const tempDirName = 'ca-config-tests'
const tempDirPath = path.join(os.tmpdir(), tempDirName)

if (!fs.existsSync(tempDirPath)) {
  fs.mkdirSync(tempDirPath)
}

function createCertAndKey (): [pki.Certificate, pki.rsa.PrivateKey] {
  let keys = pki.rsa.generateKeyPair(2048)
  let cert = pki.createCertificate()

  cert.publicKey = keys.publicKey
  cert.serialNumber = '01'
  cert.validity.notBefore = new Date()
  cert.validity.notAfter = new Date()
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1)

  let attrs = [
    {
      name: 'commonName',
      value: 'example.org',
    },
    {
      name: 'countryName',
      value: 'US',
    },
    {
      shortName: 'ST',
      value: 'California',
    },
    {
      name: 'localityName',
      value: 'San Fran',
    },
    {
      name: 'organizationName',
      value: 'Test',
    },
    {
      shortName: 'OU',
      value: 'Test',
    },
  ]

  cert.setSubject(attrs)
  cert.setIssuer(attrs)
  cert.sign(keys.privateKey)

  return [cert, keys.privateKey]
}

describe('lib/agent', function () {
  beforeEach(function () {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

    try {
      // Disabling the eslint for geteuid since we are explicitly catching if there's a problem with it
      // eslint-disable-next-line
      if (os.platform() === 'linux' && process.geteuid && process.geteuid() !== 0) {
        // eslint-disable-next-line no-console
        console.error('You must be a root user to run these tests since we specifically test hosting a server at 443 which requires root access')
      }
    } catch (error) {
      // OK to do nothing here since geteuid is only a problem on windows
    }
  })

  afterEach(function () {
    process.env.NO_PROXY = process.env.HTTP_PROXY = process.env.HTTPS_PROXY = process.env.HTTP_PROXY_TARGET_FOR_ORIGIN_REQUESTS = ''
    sinon.restore()
  })

  context('CombinedAgent', function () {
    let servers: Servers

    before(function () {
      servers = new Servers()

      return servers.start(HTTP_PORT, HTTPS_PORT)
    })

    after(function () {
      return servers.stop()
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
        proxyAuth: true,
      },
    ].slice().map((testCase) => {
      context(testCase.name, function () {
        let agent: CombinedAgent
        let request: typeof Request
        let debugProxy: DebuggingProxy
        let fetchWithAgent: typeof fetch

        beforeEach(function () {
          if (testCase.proxyUrl) {
            // PROXY vars should override npm_config vars, so set them to cause failures if they are used
            // @see https://github.com/cypress-io/cypress/pull/8295
            process.env.npm_config_proxy = process.env.npm_config_https_proxy = 'http://erroneously-used-npm-proxy.invalid'
            process.env.npm_config_noproxy = 'just,some,nonsense'

            process.env.HTTP_PROXY = process.env.HTTPS_PROXY = testCase.proxyUrl
            process.env.NO_PROXY = ''
          }

          agent = new CombinedAgent()

          request = Request.defaults({
            proxy: null,
            agent,
          })

          fetchWithAgent = function (input: RequestInfo, init?: RequestInit) {
            return fetch(input, {
              // @ts-expect-error
              agent,
              ...init,
            })
          }

          if (testCase.proxyUrl) {
            let options: any = {
              keepRequests: true,
              https: false,
              auth: false,
            }

            if (testCase.httpsProxy) {
              options.https = servers.https
            }

            if (testCase.proxyAuth) {
              options.auth = {
                username: 'foo',
                password: 'bar',
              }
            }

            debugProxy = new DebuggingProxy(options)

            return debugProxy.start(PROXY_PORT)
          }
        })

        afterEach(function () {
          if (testCase.proxyUrl) {
            debugProxy.stop()
          }
        })

        it('HTTP pages can be loaded', function () {
          return request({
            url: `http://localhost:${HTTP_PORT}/get`,
          }).then((body) => {
            expect(body).to.eq('It worked!')
            if (debugProxy) {
              expect(debugProxy.requests[0]).to.include({
                url: `http://localhost:${HTTP_PORT}/get`,
              })
            }
          })
        })

        it('HTTP pages can be loaded via fetch', function () {
          return fetchWithAgent(`http://localhost:${HTTP_PORT}/get`)
          .then((response) => response.text())
          .then((body) => {
            expect(body).to.eq('It worked!')
            if (debugProxy) {
              expect(debugProxy.requests[0]).to.include({
                url: `http://localhost:${HTTP_PORT}/get`,
              })
            }
          })
        })

        it('HTTP pages are requested with correct host header when loaded via fetch', function () {
          return fetchWithAgent(`http://localhost:${HTTP_PORT}/get`)
          .then(() => {
            expect(servers.lastRequestHeaders).to.include({
              host: `localhost:${HTTP_PORT}`,
            })
          })
        })

        it('HTTPS pages can be loaded', function () {
          return request({
            url: `https://localhost:${HTTPS_PORT}/get`,
          }).then((body) => {
            expect(body).to.eq('It worked!')
            if (debugProxy) {
              expect(debugProxy.requests[0]).to.include({
                https: true,
                url: `localhost:${HTTPS_PORT}`,
              })
            }
          })
        })

        it('HTTPS pages can be loaded via fetch', function () {
          return fetchWithAgent(`https://localhost:${HTTPS_PORT}/get`)
          .then((response) => response.text())
          .then((body) => {
            expect(body).to.eq('It worked!')
            if (debugProxy) {
              expect(debugProxy.requests[0]).to.include({
                https: true,
                url: `localhost:${HTTPS_PORT}`,
              })
            }
          })
        })

        it('HTTPS pages are requested with correct host header when loaded via fetch', function () {
          return fetchWithAgent(`https://localhost:${HTTPS_PORT}/get`)
          .then(() => {
            expect(servers.lastRequestHeaders).to.include({
              host: 'localhost',
            })
          })
        })

        it('HTTPS pages can be loaded via fetch with no explicit port', function () {
          return fetchWithAgent(`https://localhost/get`)
          .then((response) => response.text())
          .then((body) => {
            expect(body).to.eq('It worked!')
            if (debugProxy) {
              expect(debugProxy.requests[0]).to.include({
                https: true,
                url: `localhost:${HTTPS_PORT}`,
              })
            }
          })
        })

        it('HTTPS pages requested with correct host header when loaded via fetch with no explicit port', function () {
          return fetchWithAgent(`https://localhost/get`)
          .then(() => {
            expect(servers.lastRequestHeaders).to.include({
              host: 'localhost',
            })
          })
        })

        it('HTTP errors are catchable', function () {
          return request({
            url: `http://localhost:${HTTP_PORT}/empty-response`,
          })
          .then(() => {
            throw new Error('Shouldn\'t reach this')
          })
          .catch((err) => {
            if (debugProxy) {
              expect(debugProxy.requests[0]).to.include({
                url: `http://localhost:${HTTP_PORT}/empty-response`,
              })

              expect(err.statusCode).to.eq(502)
            } else {
              expect(err.message).to.eq('Error: socket hang up')
            }
          })
        })

        it('HTTPS errors are catchable', function () {
          return request({
            url: `https://localhost:${HTTPS_PORT}/empty-response`,
          })
          .then(() => {
            throw new Error('Shouldn\'t reach this')
          })
          .catch((err) => {
            expect(err.message).to.eq('Error: socket hang up')
          })
        })

        it('HTTP websocket connections can be established and used', function () {
          const socket = socketIo.client(`http://localhost:${HTTP_PORT}`, {
            agent,
            transports: ['websocket'],
            rejectUnauthorized: false,
          })

          return new Bluebird((resolve) => {
            socket.on('message', resolve)
          })
          .then((msg) => {
            expect(msg).to.eq('It worked!')
            if (debugProxy) {
              expect(debugProxy.requests[0].ws).to.be.true
              expect(debugProxy.requests[0].url).to.include('http://localhost:31080')
            }

            socket.close()
          })
        })

        it('HTTPS websocket connections can be established and used', function () {
          const socket = socketIo.client(`https://localhost:${HTTPS_PORT}`, {
            agent,
            transports: ['websocket'],
            rejectUnauthorized: false,
          })

          return new Bluebird((resolve) => {
            socket.on('message', resolve)
          })
          .then((msg) => {
            expect(msg).to.eq('It worked!')
            if (debugProxy) {
              expect(debugProxy.requests[0]).to.include({
                url: `localhost:${HTTPS_PORT}`,
              })
            }

            socket.close()
          })
        })

        // https://github.com/cypress-io/cypress/issues/5729
        it('does not warn when making a request to an IP address', function () {
          const warningStub = sinon.spy(process, 'emitWarning')

          return request({
            url: `https://127.0.0.1:${HTTPS_PORT}/get`,
          })
          .then(() => {
            expect(warningStub).to.not.be.called
          })
        })
      })
    })

    context('HttpsAgent', function () {
      let agent: CombinedAgent
      let request: typeof Request

      beforeEach(function () {
        agent = new CombinedAgent()

        request = Request.defaults({
          agent,
          proxy: null,
        })
      })

      it('#createUpstreamProxyConnection does not go to proxy if domain in NO_PROXY', function () {
        const spy = sinon.spy(agent.httpsAgent, 'createUpstreamProxyConnection')

        // Random port that is not in use on the machine
        const localPortWithoutAnythingListening = '127.0.0.1:10123'

        process.env.HTTP_PROXY = process.env.HTTPS_PROXY = `http://${localPortWithoutAnythingListening}`
        process.env.NO_PROXY = 'mtgox.info,example.com,homestarrunner.com,'

        return request({
          url: 'https://example.com/',
        })
        .then(() => {
          expect(spy).to.not.be.called

          return request({
            url: 'https://example.org/',
          })
          .then(() => {
            throw new Error('should not be able to connect')
          })
          .catch((err) => {
            expect(err.message).to.include(`Error: A connection to the upstream proxy could not be established: connect ECONNREFUSED ${localPortWithoutAnythingListening}`)
            expect(spy).to.be.calledOnce
          })
        })
      })

      it('#createUpstreamProxyConnection calls to super for caching, TLS-ifying', function () {
        const spy = sinon.spy(https.Agent.prototype, 'createConnection')

        const proxy = new DebuggingProxy()
        const proxyPort = PROXY_PORT + 1

        process.env.HTTP_PROXY = process.env.HTTPS_PROXY = `http://localhost:${proxyPort}`
        process.env.NO_PROXY = ''

        return proxy.start(proxyPort)
        .then(() => {
          return request({
            url: `https://localhost:${HTTPS_PORT}/get`,
          })
        })
        .then(() => {
          const options = spy.getCall(0).args[0]
          const session = agent.httpsAgent._sessionCache.map[options._agentKey]

          expect(spy).to.be.calledOnce
          expect(agent.httpsAgent._sessionCache.list).to.have.length(1)
          expect(session).to.not.be.undefined

          return proxy.stop()
        })
      })

      it('#createUpstreamProxyConnection throws when connection is accepted then closed', function () {
        const proxy = Bluebird.promisifyAll(
          allowDestroy(
            net.createServer((socket) => {
              socket.end()
            }),
          ),
        ) as net.Server & AsyncServer

        const proxyPort = PROXY_PORT + 2

        process.env.HTTP_PROXY = process.env.HTTPS_PROXY = `http://localhost:${proxyPort}`
        process.env.NO_PROXY = ''

        return proxy.listenAsync(proxyPort)
        .then(() => {
          return request({
            url: `https://localhost:${HTTPS_PORT}/get`,
          })
        })
        .then(() => {
          throw new Error('should not succeed')
        })
        .catch((e) => {
          expect(e.message).to.eq('Error: A connection to the upstream proxy could not be established: ERR_EMPTY_RESPONSE: The upstream proxy closed the socket after connecting but before sending a response.')

          return proxy.destroyAsync()
        })
      })
    })

    context('HttpAgent', function () {
      let agent: CombinedAgent
      let request: typeof Request

      beforeEach(function () {
        agent = new CombinedAgent()

        request = Request.defaults({
          agent,
          proxy: null,
        })
      })

      it('#addRequest does not go to proxy if domain in NO_PROXY', function () {
        const spy = sinon.spy(agent.httpAgent, '_addProxiedRequest')

        // Random port that is not in use on the machine
        const localPortWithoutAnythingListening = '127.0.0.1:10123'

        process.env.HTTP_PROXY = process.env.HTTPS_PROXY = `http://${localPortWithoutAnythingListening}`
        process.env.NO_PROXY = 'mtgox.info,example.com,homestarrunner.com,'

        return request({
          url: 'http://example.com/',
        })
        .then(() => {
          expect(spy).to.not.be.called

          return request({
            url: 'http://example.org/',
          })
          .then(() => {
            throw new Error('should not be able to connect')
          })
          .catch((err) => {
            expect(err.message).to.include(`Error: connect ECONNREFUSED ${localPortWithoutAnythingListening}`)
            expect(spy).to.be.calledOnce
          })
        })
      })

      it('HTTP pages can be loaded with the Upstream target URL', function () {
        process.env.HTTP_PROXY = process.env.HTTPS_PROXY = ''
        process.env.NO_PROXY = ''
        process.env.HTTP_PROXY_TARGET_FOR_ORIGIN_REQUESTS = `http://localhost:${HTTP_PORT}`

        return new Promise((resolve) => {
          request({
            url: `http://localhost:${HTTP_PORT}/get`,
          })
          .on('response', resolve)
        })
        .then((response) => {
          expect(response.req.path).to.equal('http://localhost:31080/get')
        })
      })
    })
  })

  context('CombinedAgent with CA overrides', function () {
    const proxyUrl = `https://localhost:${PROXY_PORT}`

    let servers: Servers

    before(function () {
      servers = new Servers()

      return servers.start(HTTP_PORT, HTTPS_PORT)
    })

    after(function () {
      return servers.stop()
    })

    ;[
      {
        name: 'should use the npm_config_cafile override',
        option: 'npm_config_cafile',
      },
      {
        name: 'should use the npm_config_ca override',
        option: 'npm_config_ca',
      },
      {
        name: 'should use the NODE_EXTRA_CA_CERTS override',
        option: 'NODE_EXTRA_CA_CERTS',
      },
    ].slice().map((testCase) => {
      context(testCase.name, function () {
        let agent: CombinedAgent
        let request: typeof Request
        let debugProxy: DebuggingProxy

        beforeEach(function () {
          // PROXY vars should override npm_config vars, so set them to cause failures if they are used
          // @see https://github.com/cypress-io/cypress/pull/8295
          process.env.npm_config_proxy = process.env.npm_config_https_proxy = 'http://erroneously-used-npm-proxy.invalid'
          process.env.npm_config_noproxy = 'just,some,nonsense'

          process.env.HTTP_PROXY = process.env.HTTPS_PROXY = proxyUrl
          process.env.NO_PROXY = ''

          agent = new CombinedAgent()

          request = Request.defaults({
            proxy: null,
            agent,
          })

          let options: any = {
            keepRequests: true,
            https: {
              ...servers.https,
              ca: this.caContents,
            },
            auth: false,
          }

          if (testCase.option === 'npm_config_cafile') {
            process.env.npm_config_cafile = servers.caCertificatePath
            this.caContents = [fs.readFileSync(servers.caCertificatePath, 'utf-8')]

            // Ensure the priority picks cafile over the next two options
            process.env.npm_config_ca = 'a'
            process.env.NODE_EXTRA_CA_CERTS = 'b'
          }

          if (testCase.option === 'npm_config_ca') {
            this.caContents = [fs.readFileSync(servers.caCertificatePath, 'utf-8')]
            process.env.npm_config_ca = this.caContents[0]

            // Ensure the priority picks cafile over the next option
            process.env.NODE_EXTRA_CA_CERTS = 'b'
          }

          if (testCase.option === 'NODE_EXTRA_CA_CERTS') {
            process.env.NODE_EXTRA_CA_CERTS = servers.caCertificatePath
            this.caContents = [fs.readFileSync(servers.caCertificatePath, 'utf-8'), ...tls.rootCertificates]
          }

          _resetBaseCaOptionsPromise()

          debugProxy = new DebuggingProxy(options)

          return debugProxy.start(PROXY_PORT)
        })

        afterEach(function () {
          delete process.env.npm_config_cafile
          delete process.env.npm_config_ca
          delete process.env.NODE_EXTRA_CA_CERTS
          debugProxy.stop()
        })

        it(`CA from ${testCase.option} presented for https request`, function () {
          return request({
            url: `https://localhost:${HTTPS_PORT}/get`,
            rejectUnauthorized: true,
          }).then((body) => {
            // Test the CA options the first time through
            expect(body).to.eq('It worked!')
            if (debugProxy) {
              expect(debugProxy.requests[0]).to.include({
                https: true,
                url: `localhost:${HTTPS_PORT}`,
              })
            }

            const socketKey = Object.keys(agent.httpsAgent.sockets).filter((key) => key.includes(`localhost:${HTTPS_PORT}`))

            expect(socketKey.length).to.eq(1, 'There should only be a single localhost TLS Socket')

            for (const ca of this.caContents) {
              expect(socketKey[0]).to.contain(ca, `${testCase.option} should be used for the TLS Socket`)
            }

            return request({
              url: `https://localhost:${HTTPS_PORT}/get`,
            })
          }).then((body) => {
            // Test that the caching of the ca options works
            expect(body).to.eq('It worked!')
            if (debugProxy) {
              expect(debugProxy.requests[0]).to.include({
                https: true,
                url: `localhost:${HTTPS_PORT}`,
              })
            }

            const socketKey = Object.keys(agent.httpsAgent.sockets).filter((key) => key.includes(`localhost:${HTTPS_PORT}`))

            expect(socketKey.length).to.eq(1, 'There should only be a single localhost TLS Socket')

            for (const ca of this.caContents) {
              expect(socketKey[0]).to.contain(ca, `${testCase.option} should be used for the TLS Socket`)
            }
          })
        })
      })
    })
  })

  context('CombinedAgent with client certificates', function () {
    const proxyUrl = `https://localhost:${PROXY_PORT}`

    let servers: Servers

    before(function () {
      servers = new Servers()

      return servers.start(HTTP_PORT, HTTPS_PORT)
    })

    after(function () {
      return servers.stop()
    })

    ;[
      {
        name: 'should present a client certificate',
        presentClientCertificate: true,
      },
      {
        name: 'should present a client certificate with npm_config_cafile',
        option: 'npm_config_cafile',
        presentClientCertificate: true,
      },
      {
        name: 'should present a client certificate with npm_config_ca',
        option: 'npm_config_ca',
        presentClientCertificate: true,
      },
      {
        name: 'should present a client certificate with NODE_EXTRA_CA_CERTS',
        option: 'NODE_EXTRA_CA_CERTS',
        presentClientCertificate: true,
      },
      {
        name: 'should not present a client certificate',
        presentClientCertificate: false,
      },
    ].slice().map((testCase) => {
      context(testCase.name, function () {
        let agent: CombinedAgent
        let request: typeof Request
        let debugProxy: DebuggingProxy

        beforeEach(function () {
          // PROXY vars should override npm_config vars, so set them to cause failures if they are used
          // @see https://github.com/cypress-io/cypress/pull/8295
          process.env.npm_config_proxy = process.env.npm_config_https_proxy = 'http://erroneously-used-npm-proxy.invalid'
          process.env.npm_config_noproxy = 'just,some,nonsense'

          process.env.HTTP_PROXY = process.env.HTTPS_PROXY = proxyUrl
          process.env.NO_PROXY = ''

          agent = new CombinedAgent()

          request = Request.defaults({
            proxy: null,
            agent,
          })

          let options: any = {
            keepRequests: true,
            https: servers.https,
            auth: false,
          }

          if (testCase.presentClientCertificate) {
            clientCertificateStore.clear()
            const certAndKey = createCertAndKey()
            const pemCert = pki.certificateToPem(certAndKey[0])

            this.clientCert = pemCert
            const testCerts = new UrlClientCertificates(`https://localhost`)

            testCerts.clientCertificates = new ClientCertificates()
            testCerts.clientCertificates.cert.push(Buffer.from(pemCert, 'utf-8'))
            testCerts.clientCertificates.key.push(new PemKey(Buffer.from(pki.privateKeyToPem(certAndKey[1]), 'utf-8'), undefined))
            clientCertificateStore.addClientCertificatesForUrl(testCerts)
          }

          if (testCase.option === 'npm_config_cafile') {
            process.env.npm_config_cafile = servers.caCertificatePath
            this.caContents = [fs.readFileSync(servers.caCertificatePath, 'utf-8')]

            // Ensure the priority picks cafile over the next two options
            process.env.npm_config_ca = 'a'
            process.env.NODE_EXTRA_CA_CERTS = 'b'
          }

          if (testCase.option === 'npm_config_ca') {
            this.caContents = [fs.readFileSync(servers.caCertificatePath, 'utf-8')]
            process.env.npm_config_ca = this.caContents[0]

            // Ensure the priority picks cafile over the next option
            process.env.NODE_EXTRA_CA_CERTS = 'b'
          }

          if (testCase.option === 'NODE_EXTRA_CA_CERTS') {
            process.env.NODE_EXTRA_CA_CERTS = servers.caCertificatePath
            this.caContents = [fs.readFileSync(servers.caCertificatePath, 'utf-8'), ...tls.rootCertificates]
          }

          _resetBaseCaOptionsPromise()

          debugProxy = new DebuggingProxy(options)

          return debugProxy.start(PROXY_PORT)
        })

        afterEach(function () {
          delete process.env.npm_config_cafile
          delete process.env.npm_config_ca
          delete process.env.NODE_EXTRA_CA_CERTS
          debugProxy.stop()
        })

        it(`Client certificate${testCase.presentClientCertificate ? ' ' : ' not '}presented for https request${testCase.option ? ` with config option ${testCase.option}` : '' }`, function () {
          return request({
            url: `https://localhost:${HTTPS_PORT}/get`,
          }).then((body) => {
            expect(body).to.eq('It worked!')
            if (debugProxy) {
              expect(debugProxy.requests[0]).to.include({
                https: true,
                url: `localhost:${HTTPS_PORT}`,
              })
            }

            const socketKey = Object.keys(agent.httpsAgent.sockets).filter((key) => key.includes(`localhost:${HTTPS_PORT}`))

            expect(socketKey.length).to.eq(1, 'There should only be a single localhost TLS Socket')

            // If a client cert has been assigned to a TLS connection, the key for the TLSSocket
            // will include the public certificate
            if (this.clientCert) {
              expect(socketKey[0]).to.contain(this.clientCert, 'A client cert should be used for the TLS Socket')
            } else {
              expect(socketKey[0]).not.to.contain(this.clientCert, 'A client cert should not be used for the TLS Socket')
            }

            if (this.caContents) {
              for (const ca of this.caContents) {
                expect(socketKey[0]).to.contain(ca, `${testCase.option} should be used for the TLS Socket`)
              }
            }
          })
        })

        it(`Client certificate${testCase.presentClientCertificate ? ' ' : ' not '}presented for https websocket`, function () {
          const socket = socketIo.client(`https://localhost:${HTTPS_PORT}`, {
            agent,
            transports: ['websocket'],
            rejectUnauthorized: false,
          })

          return new Bluebird((resolve) => {
            socket.on('message', resolve)
          })
          .then((msg) => {
            expect(msg).to.eq('It worked!')
            if (debugProxy) {
              expect(debugProxy.requests[0]).to.include({
                url: `localhost:${HTTPS_PORT}`,
              })
            }

            socket.close()
          })
        })
      })
    })
  })

  context('.buildConnectReqHead', function () {
    it('builds the correct request', function () {
      const head = buildConnectReqHead('foo.bar', '1234', {})

      expect(head).to.eq([
        'CONNECT foo.bar:1234 HTTP/1.1',
        'Host: foo.bar:1234',
        '', '',
      ].join('\r\n'))
    })

    it('can do Proxy-Authorization', function () {
      const head = buildConnectReqHead('foo.bar', '1234', {
        auth: 'baz:quux',
      })

      expect(head).to.eq([
        'CONNECT foo.bar:1234 HTTP/1.1',
        'Host: foo.bar:1234',
        'Proxy-Authorization: Basic YmF6OnF1dXg=',
        '', '',
      ].join('\r\n'))
    })
  })

  context('.createProxySock', function () {
    it('creates a `net` socket for an http url', function (done) {
      sinon.spy(net, 'connect')
      const proxy = url.parse('http://foo.bar:1234')

      createProxySock({ proxy }, () => {
        expect(net.connect).to.be.calledWith({ family: 4, host: 'foo.bar', port: 1234 })
        done()
      })
    })

    it('creates a `tls` socket for an https url', function (done) {
      sinon.spy(tls, 'connect')
      const proxy = url.parse('https://foo.bar:1234')

      createProxySock({ proxy }, () => {
        expect(tls.connect).to.be.calledWith({ family: 4, host: 'foo.bar', port: 1234 })
        done()
      })
    })

    it('throws on unsupported proxy protocol', function (done) {
      const proxy = url.parse('socksv5://foo.bar:1234')

      createProxySock({ proxy }, (err) => {
        expect(err.message).to.eq('Unsupported proxy protocol: socksv5:')
        done()
      })
    })
  })

  context('.isRequestHttps', function () {
    [
      {
        protocol: 'http',
        agent: http.globalAgent,
        expect: false,
      },
      {
        protocol: 'https',
        agent: https.globalAgent,
        expect: true,
      },
    ].map((testCase) => {
      it(`detects correctly from ${testCase.protocol} requests`, () => {
        const spy = sinon.spy(testCase.agent, 'addRequest')

        return Request({
          url: `${testCase.protocol}://foo.bar.baz.invalid`,
          agent: testCase.agent,
        })
        .then(() => {
          throw new Error('Shouldn\'t succeed')
        })
        .catch(() => {
          const requestOptions = spy.getCall(0).args[1]

          expect(isRequestHttps(requestOptions)).to.equal(testCase.expect)
        })
      })

      it(`detects correctly from ${testCase.protocol} websocket requests`, () => {
        const spy = sinon.spy(testCase.agent, 'addRequest')
        const socket = socketIo.client(`${testCase.protocol}://foo.bar.baz.invalid`, {
          agent: testCase.agent as any,
          transports: ['websocket'],
          timeout: 1,
          rejectUnauthorized: false,
        })

        return new Bluebird((resolve, reject) => {
          socket.on('message', reject)
          socket.io.on('error', resolve)
        })
        .then(() => {
          const requestOptions = spy.getCall(0).args[1]

          expect(isRequestHttps(requestOptions)).to.equal(testCase.expect)

          socket.close()
        })
      })
    })
  })

  context('.isResponseStatusCode200', function () {
    it('matches a 200 OK response correctly', function () {
      const result = isResponseStatusCode200('HTTP/1.1 200 Connection established')

      expect(result).to.be.true
    })

    it('matches a 500 error response correctly', function () {
      const result = isResponseStatusCode200('HTTP/1.1 500 Internal Server Error')

      expect(result).to.be.false
    })
  })

  context('.regenerateRequestHead', function () {
    it('regenerates changed request head', () => {
      const spy = sinon.spy(http.globalAgent, 'createSocket')

      return Request({
        url: 'http://foo.bar.baz.invalid',
        agent: http.globalAgent,
      })
      .then(() => {
        throw new Error('this should fail')
      })
      .catch(() => {
        const req = spy.getCall(0).args[0]

        expect(req._header).to.equal([
          'GET / HTTP/1.1',
          'host: foo.bar.baz.invalid',
          // `keep-alive` was changed to be the default in Node 19:
          // https://nodejs.org/en/blog/announcements/v19-release-announce#https11-keepalive-by-default
          'Connection: keep-alive',
          '', '',
        ].join('\r\n'))

        // now change some stuff, regen, and expect it to work
        delete req._header
        // @ts-ignore
        req.path = 'http://quuz.quux.invalid/abc?def=123'
        req.setHeader('Host', 'foo.fleem.invalid')
        req.setHeader('bing', 'bang')
        regenerateRequestHead(req)
        expect(req._header).to.equal([
          'GET http://quuz.quux.invalid/abc?def=123 HTTP/1.1',
          'Host: foo.fleem.invalid',
          'bing: bang',
          // `keep-alive` was changed to be the default in Node 19:
          // https://nodejs.org/en/blog/announcements/v19-release-announce#https11-keepalive-by-default
          'Connection: keep-alive',
          '', '',
        ].join('\r\n'))
      })
    })
  })

  context('.getFirstWorkingFamily', () => {
    let servers: http.Server[] = []

    const listen = (options: ListenOptions) => {
      return Bluebird.fromCallback((cb) => {
        const server = http.createServer((req, res) => {
          res.end('Hello, world!')
        })

        servers.push(server)

        server.listen(options, cb.bind(server))
      })
    }

    const getFamilyAsPromise = (host: string, port: number, familyCache): Promise<net.family | undefined> => {
      return new Promise((resolve) => {
        getFirstWorkingFamily({ host, port }, familyCache, resolve)
      })
    }

    beforeEach(() => {
      servers = []
    })

    afterEach(() => {
      return Bluebird.map(servers, (server) => {
        return Bluebird.fromCallback((cb) => {
          server.close(cb.bind(server))
        })
      })
    })

    it('caches host + port', async function () {
      // If we are on CI and IPV6 is explicitly disabled (like in the contributor PR workflow)
      // then we skip this test
      if (process.env.CIRCLE_IPV6_DISABLED) {
        this.skip()
      }

      const familyCache = {}

      await Promise.all([
        // v4 server only
        listen({
          port: HTTP_PORT + 1,
          host: '127.0.0.1',
        }),

        // v6 server only
        listen({
          port: HTTP_PORT + 2,
          host: '::1',
          ipv6Only: true,
        }),

        // v6 server only
        listen({
          port: HTTP_PORT + 3,
          host: '::1',
          ipv6Only: true,
        }),

        // v4 server only
        listen({
          port: HTTP_PORT + 4,
          host: '127.0.0.1',
        }),
      ])

      const families: Record<string, number> = {}

      // start with a v4 address
      families.familySet1 = await getFamilyAsPromise('localhost', HTTP_PORT + 1, familyCache)

      // then use a v6 only port with the same host
      families.familySet1CachedNewPort = await getFamilyAsPromise('localhost', HTTP_PORT + 2, familyCache)

      // start with a v6 address
      families.familySet2 = await getFamilyAsPromise('localhost', HTTP_PORT + 3, familyCache)

      // then use a v4 only port with the same host
      families.familySet2CachedNewPort = await getFamilyAsPromise('localhost', HTTP_PORT + 4, familyCache)

      expect(families).to.deep.eq({
        familySet1: 4,
        familySet1CachedNewPort: 6,
        familySet2: 6,
        familySet2CachedNewPort: 4,
      })

      const expectedFamilyCache = {}

      expectedFamilyCache[`localhost:${HTTP_PORT + 1}`] = 4
      expectedFamilyCache[`localhost:${HTTP_PORT + 2}`] = 6
      expectedFamilyCache[`localhost:${HTTP_PORT + 3}`] = 6
      expectedFamilyCache[`localhost:${HTTP_PORT + 4}`] = 4

      expect(familyCache).to.deep.eq(expectedFamilyCache)
    })

    it('returns from the cache', async () => {
      const familyCache = {
        // not a valid ip family to test it using the cache
        'localhost:2222': 2,
      }

      const family = await getFamilyAsPromise('localhost', 2222, familyCache)

      expect(family).to.eq(2)
    })
  })
})
