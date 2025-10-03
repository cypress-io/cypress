import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import Bluebird from 'bluebird'

import http from 'http'
import https from 'https'
import net, { type ListenOptions } from 'net'
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
  _resetBaseCaOptionsPromise,
  getFirstWorkingFamily,
} from '../../lib/agent'
import { allowDestroy } from '../../lib/allow-destroy'
import { AsyncServer, Servers } from '../support/servers'
import { clientCertificateStoreSingleton, UrlClientCertificates, ClientCertificates, PemKey } from '../../lib/client-certificates'
import { pki } from 'node-forge'
import fetch from 'cross-fetch'
import os from 'os'
import path from 'path'
import fs from 'fs'

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
    vi.unstubAllEnvs()

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

  describe('CombinedAgent', function () {
    let servers: Servers
    const testCases = [
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
    ]

    beforeAll(async () => {
      servers = new Servers()

      await servers.start(HTTP_PORT, HTTPS_PORT)
    })

    afterAll(async () => {
      await servers.stop()
    })

    testCases.forEach((testCase) => {
      describe(testCase.name, function () {
        let agent: CombinedAgent
        let request: typeof Request
        let debugProxy: DebuggingProxy
        let fetchWithAgent: typeof fetch

        beforeEach(function () {
          if (testCase.proxyUrl) {
            // PROXY vars should override npm_config vars, so set them to cause failures if they are used
            // @see https://github.com/cypress-io/cypress/pull/8295
            vi.stubEnv('npm_config_proxy', 'http://erroneously-used-npm-proxy.invalid')
            vi.stubEnv('npm_config_https_proxy', 'http://erroneously-used-npm-proxy.invalid')
            vi.stubEnv('npm_config_noproxy', 'just,some,nonsense')
            vi.stubEnv('HTTP_PROXY', testCase.proxyUrl)
            vi.stubEnv('HTTPS_PROXY', testCase.proxyUrl)
            vi.stubEnv('NO_PROXY', '')
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

        it('HTTP pages can be loaded', async () => {
          const body = await request({
            url: `http://localhost:${HTTP_PORT}/get`,
          })

          expect(body).toEqual('It worked!')
          if (debugProxy) {
            expect(debugProxy.requests[0]).toEqual(expect.objectContaining({
              url: `http://localhost:${HTTP_PORT}/get`,
            }))
          }
        })

        it('HTTP pages can be loaded via fetch', async () => {
          const response = await fetchWithAgent(`http://localhost:${HTTP_PORT}/get`)

          const body = await response.text()

          expect(body).toEqual('It worked!')
          if (debugProxy) {
            expect(debugProxy.requests[0]).toEqual(expect.objectContaining({
              url: `http://localhost:${HTTP_PORT}/get`,
            }))
          }
        })

        it('HTTP pages are requested with correct host header when loaded via fetch', async () => {
          await fetchWithAgent(`http://localhost:${HTTP_PORT}/get`)

          expect(servers.lastRequestHeaders).toEqual(expect.objectContaining({
            host: `localhost:${HTTP_PORT}`,
          }))
        })

        it('HTTPS pages can be loaded', async () => {
          const body = await request({
            url: `https://localhost:${HTTPS_PORT}/get`,
          })

          expect(body).toEqual('It worked!')
          if (debugProxy) {
            expect(debugProxy.requests[0]).toEqual(expect.objectContaining({
              https: true,
              url: `localhost:${HTTPS_PORT}`,
            }))
          }
        })

        it('HTTPS pages can be loaded via fetch', async () => {
          const response = await fetchWithAgent(`https://localhost:${HTTPS_PORT}/get`)
          const body = await response.text()

          expect(body).toEqual('It worked!')
          if (debugProxy) {
            expect(debugProxy.requests[0]).toEqual(expect.objectContaining({
              https: true,
              url: `localhost:${HTTPS_PORT}`,
            }))
          }
        })

        it('HTTPS pages are requested with correct host header when loaded via fetch', async () => {
          await fetchWithAgent(`https://localhost:${HTTPS_PORT}/get`)

          expect(servers.lastRequestHeaders).toEqual(expect.objectContaining({
            host: expect.stringContaining('localhost'),
          }))
        })

        it('HTTPS pages can be loaded via fetch with no explicit port', async () => {
          const response = await fetchWithAgent(`https://localhost/get`)
          const body = await response.text()

          expect(body).toEqual('It worked!')
          if (debugProxy) {
            expect(debugProxy.requests[0]).toEqual(expect.objectContaining({
              https: true,
              url: `localhost:${HTTPS_PORT}`,
            }))
          }
        })

        it('HTTPS pages requested with correct host header when loaded via fetch with no explicit port', async () => {
          await fetchWithAgent(`https://localhost/get`)

          expect(servers.lastRequestHeaders).toEqual(expect.objectContaining({
            host: expect.stringContaining('localhost'),
          }))
        })

        it('HTTP errors are catchable', async () => {
          try {
            await request({
              url: `http://localhost:${HTTP_PORT}/empty-response`,
            })

            throw new Error('Shouldn\'t reach this')
          } catch (err) {
            if (debugProxy) {
              expect(debugProxy.requests[0]).toEqual(expect.objectContaining({
                url: `http://localhost:${HTTP_PORT}/empty-response`,
              }))

              expect(err.statusCode).toEqual(502)
            } else {
              expect(err.message).toEqual('Error: socket hang up')
            }
          }
        })

        it('HTTPS errors are catchable', async () => {
          try {
            await request({
              url: `https://localhost:${HTTPS_PORT}/empty-response`,
            })

            throw new Error('Shouldn\'t reach this')
          } catch (err) {
            expect(err.message).toEqual('Error: socket hang up')
          }
        })

        it('HTTP websocket connections can be established and used', async () => {
          const socket = socketIo.client(`http://localhost:${HTTP_PORT}`, {
            // @ts-expect-error
            agent,
            transports: ['websocket'],
            rejectUnauthorized: false,
          })

          const message = await new Promise((resolve) => {
            socket.on('message', resolve)
          })

          expect(message).toEqual('It worked!')
          if (debugProxy) {
            expect(debugProxy.requests[0].ws).toEqual(true)
            expect(debugProxy.requests[0].url).toEqual(expect.stringContaining('http://localhost:31080'))
          }

          // @ts-expect-error
          socket.close()
        })

        it('HTTPS websocket connections can be established and used', async () => {
          const socket = socketIo.client(`https://localhost:${HTTPS_PORT}`, {
            // @ts-expect-error
            agent,
            transports: ['websocket'],
            rejectUnauthorized: false,
          })

          const message = await new Promise((resolve) => {
            socket.on('message', resolve)
          })

          expect(message).toEqual('It worked!')
          if (debugProxy) {
            expect(debugProxy.requests[0]).toEqual(expect.objectContaining({
              url: `localhost:${HTTPS_PORT}`,
            }))
          }

          // @ts-expect-error
          socket.close()
        })

        // https://github.com/cypress-io/cypress/issues/5729
        it('does not warn when making a request to an IP address', async () => {
          const warningStub = vi.spyOn(process, 'emitWarning')

          await request({
            url: `https://127.0.0.1:${HTTPS_PORT}/get`,
          })

          expect(warningStub).not.toHaveBeenCalled()
        })
      })
    })

    describe('HttpsAgent', function () {
      let agent: CombinedAgent
      let request: typeof Request

      beforeEach(function () {
        agent = new CombinedAgent()

        request = Request.defaults({
          agent,
          proxy: null,
        })
      })

      it('#createUpstreamProxyConnection does not go to proxy if domain in NO_PROXY', async () => {
        const spy = vi.spyOn(agent.httpsAgent, 'createUpstreamProxyConnection')

        // Random port that is not in use on the machine
        const localPortWithoutAnythingListening = '127.0.0.1:10123'

        vi.stubEnv('HTTP_PROXY', `http://${localPortWithoutAnythingListening}`)
        vi.stubEnv('HTTPS_PROXY', `http://${localPortWithoutAnythingListening}`)
        vi.stubEnv('NO_PROXY', 'mtgox.info,example.com,homestarrunner.com,')

        await request({
          url: 'https://example.com/',
        })

        expect(spy).not.toHaveBeenCalled()

        try {
          await request({
            url: 'https://example.org/',
          })

          throw new Error('should not be able to connect')
        } catch (err) {
          expect(err.message).toEqual(`Error: A connection to the upstream proxy could not be established: connect ECONNREFUSED ${localPortWithoutAnythingListening}`)
          expect(spy).toHaveBeenCalledOnce()
        }
      })

      it('#createUpstreamProxyConnection calls to super for caching, TLS-ifying', async () => {
        const spy = vi.spyOn(https.Agent.prototype, 'createConnection')

        const proxy = new DebuggingProxy()
        const proxyPort = PROXY_PORT + 1

        vi.stubEnv('HTTP_PROXY', `http://localhost:${proxyPort}`)
        vi.stubEnv('HTTPS_PROXY', `http://localhost:${proxyPort}`)
        vi.stubEnv('NO_PROXY', '')

        await proxy.start(proxyPort)

        await request({
          url: `https://localhost:${HTTPS_PORT}/get`,
        })

        const options = spy.mock.calls[0][0]
        // @ts-expect-error
        const session = agent.httpsAgent._sessionCache.map[options._agentKey]

        expect(spy).toHaveBeenCalledOnce()
        expect(agent.httpsAgent._sessionCache.list).toHaveLength(1)
        expect(session).toBeDefined()

        await proxy.stop()
      })

      it('#createUpstreamProxyConnection throws when connection is accepted then closed', async () => {
        const proxy = Bluebird.promisifyAll(
          allowDestroy(
            net.createServer((socket) => {
              socket.end()
            }),
          ),
        ) as net.Server & AsyncServer

        const proxyPort = PROXY_PORT + 2

        vi.stubEnv('HTTP_PROXY', `http://localhost:${proxyPort}`)
        vi.stubEnv('HTTPS_PROXY', `http://localhost:${proxyPort}`)
        vi.stubEnv('NO_PROXY', '')

        await proxy.listenAsync(proxyPort)
        try {
          await request({
            url: `https://localhost:${HTTPS_PORT}/get`,
          })

          throw new Error('should not succeed')
        } catch (err) {
          expect(err.message).toEqual('Error: A connection to the upstream proxy could not be established: ERR_EMPTY_RESPONSE: The upstream proxy closed the socket after connecting but before sending a response.')
        } finally {
          await proxy.destroyAsync()
        }
      })
    })

    describe('HttpAgent', function () {
      let agent: CombinedAgent
      let request: typeof Request

      beforeEach(function () {
        agent = new CombinedAgent()

        request = Request.defaults({
          agent,
          proxy: null,
        })
      })

      it('#addRequest does not go to proxy if domain in NO_PROXY', async () => {
        const spy = vi.spyOn(agent.httpAgent, '_addProxiedRequest')

        // Random port that is not in use on the machine
        const localPortWithoutAnythingListening = '127.0.0.1:10123'

        vi.stubEnv('HTTP_PROXY', `http://${localPortWithoutAnythingListening}`)
        vi.stubEnv('HTTPS_PROXY', `http://${localPortWithoutAnythingListening}`)
        vi.stubEnv('NO_PROXY', 'mtgox.info,example.com,homestarrunner.com,')

        await request({
          url: 'http://example.com/',
        })

        expect(spy).not.toHaveBeenCalled()

        try {
          await request({
            url: 'http://example.org/',
          })

          throw new Error('should not be able to connect')
        } catch (err) {
          expect(err.message).toEqual(`Error: connect ECONNREFUSED ${localPortWithoutAnythingListening}`)
          expect(spy).toHaveBeenCalledOnce()
        }
      })

      it('HTTP pages can be loaded with the Upstream target URL', async () => {
        vi.stubEnv('HTTP_PROXY', '')
        vi.stubEnv('HTTPS_PROXY', '')
        vi.stubEnv('NO_PROXY', '')
        vi.stubEnv('HTTP_PROXY_TARGET_FOR_ORIGIN_REQUESTS', `http://localhost:${HTTP_PORT}`)

        const response = await new Promise((resolve) => {
          request({
            url: `http://localhost:${HTTP_PORT}/get`,
          })
          .on('response', resolve)
        })

        // @ts-expect-error
        expect(response.req.path).toEqual('http://localhost:31080/get')
      })
    })
  })

  describe('CombinedAgent with CA overrides', function () {
    const proxyUrl = `https://localhost:${PROXY_PORT}`
    const testCases = [
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
    ]
    let servers: Servers
    let caContents: string[]

    beforeAll(async () => {
      servers = new Servers()

      await servers.start(HTTP_PORT, HTTPS_PORT)
    })

    afterAll(async () => {
      await servers.stop()
    })

    testCases.map((testCase) => {
      describe(testCase.name, function () {
        let agent: CombinedAgent
        let request: typeof Request
        let debugProxy: DebuggingProxy

        beforeEach(async () => {
          vi.unstubAllEnvs()
          // PROXY vars should override npm_config vars, so set them to cause failures if they are used
          // @see https://github.com/cypress-io/cypress/pull/8295r
          vi.stubEnv('npm_config_proxy', 'http://erroneously-used-npm-proxy.invalid')
          vi.stubEnv('npm_config_https_proxy', 'http://erroneously-used-npm-proxy.invalid')
          vi.stubEnv('npm_config_noproxy', 'just,some,nonsense')

          vi.stubEnv('HTTP_PROXY', proxyUrl)
          vi.stubEnv('HTTPS_PROXY', proxyUrl)
          vi.stubEnv('NO_PROXY', '')

          agent = new CombinedAgent()

          request = Request.defaults({
            proxy: null,
            agent,
          })

          if (testCase.option === 'npm_config_cafile') {
            vi.stubEnv('npm_config_cafile', servers.caCertificatePath)
            caContents = [fs.readFileSync(servers.caCertificatePath, 'utf-8')]

            // Ensure the priority picks cafile over the next two options
            vi.stubEnv('npm_config_ca', 'a')
            vi.stubEnv('NODE_EXTRA_CA_CERTS', 'b')
          }

          if (testCase.option === 'npm_config_ca') {
            caContents = [fs.readFileSync(servers.caCertificatePath, 'utf-8')]
            vi.stubEnv('npm_config_ca', caContents[0])

            // Ensure the priority picks cafile over the next option
            vi.stubEnv('NODE_EXTRA_CA_CERTS', 'b')
          }

          if (testCase.option === 'NODE_EXTRA_CA_CERTS') {
            vi.stubEnv('NODE_EXTRA_CA_CERTS', servers.caCertificatePath)
            caContents = [fs.readFileSync(servers.caCertificatePath, 'utf-8'), ...tls.rootCertificates]
          }

          let options: any = {
            keepRequests: true,
            https: {
              ...servers.https,
              ca: caContents,
            },
            auth: false,
          }

          _resetBaseCaOptionsPromise()

          debugProxy = new DebuggingProxy(options)

          await debugProxy.start(PROXY_PORT)
        })

        afterEach(async () => {
          await debugProxy.stop()
        })

        it(`CA from ${testCase.option} presented for https request`, async () => {
          {
            const body = await request({
              url: `https://localhost:${HTTPS_PORT}/get`,
              rejectUnauthorized: true,
            })

            // Test the CA options the first time through
            expect(body).toEqual('It worked!')
            if (debugProxy) {
              expect(debugProxy.requests[0]).toEqual(expect.objectContaining({
                https: true,
                url: `localhost:${HTTPS_PORT}`,
              }))
            }

            const socketKey = Object.keys(agent.httpsAgent.sockets).filter((key) => key.includes(`localhost:${HTTPS_PORT}`))

            // There should only be a single localhost TLS Socket
            expect(socketKey.length).toEqual(1)

            for (const ca of caContents) {
              expect(socketKey[0], `${testCase.option} should be used for the TLS Socket`).toEqual(expect.stringContaining(ca))
            }
          }
          {
            const body = await request({
              url: `https://localhost:${HTTPS_PORT}/get`,
            })

            expect(body).toEqual('It worked!')
            if (debugProxy) {
              expect(debugProxy.requests[0]).toEqual(expect.objectContaining({
                https: true,
                url: `localhost:${HTTPS_PORT}`,
              }))
            }

            const socketKey = Object.keys(agent.httpsAgent.sockets).filter((key) => key.includes(`localhost:${HTTPS_PORT}`))

            // There should only be a single localhost TLS Socket
            expect(socketKey.length).toEqual(1)

            if (caContents.length > 0) {
              expect(socketKey[0], `option: ${testCase.option || 'none'} should be used for the TLS Socket`).toEqual(expect.stringContaining(caContents[0]))
            }
          }
        })
      })
    })
  })

  describe('CombinedAgent with client certificates', function () {
    const proxyUrl = `https://localhost:${PROXY_PORT}`
    const testCases = [
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
    ]
    let servers: Servers
    let clientCert: string
    let caContents: string[]

    beforeAll(async () => {
      servers = new Servers()

      await servers.start(HTTP_PORT, HTTPS_PORT)
    })

    afterAll(async () => {
      await servers.stop()
    })

    testCases.map((testCase) => {
      describe(testCase.name, function () {
        let agent: CombinedAgent
        let request: typeof Request
        let debugProxy: DebuggingProxy

        beforeEach(function () {
          vi.unstubAllEnvs()
          // PROXY vars should override npm_config vars, so set them to cause failures if they are used
          // @see https://github.com/cypress-io/cypress/pull/8295
          vi.stubEnv('npm_config_proxy', 'http://erroneously-used-npm-proxy.invalid')
          vi.stubEnv('npm_config_https_proxy', 'http://erroneously-used-npm-proxy.invalid')
          vi.stubEnv('npm_config_noproxy', 'just,some,nonsense')

          vi.stubEnv('HTTP_PROXY', proxyUrl)
          vi.stubEnv('HTTPS_PROXY', proxyUrl)
          vi.stubEnv('NO_PROXY', '')

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
            clientCertificateStoreSingleton.clear()
            const certAndKey = createCertAndKey()
            const pemCert = pki.certificateToPem(certAndKey[0])

            clientCert = pemCert
            const testCerts = new UrlClientCertificates(`https://localhost`)

            testCerts.clientCertificates = new ClientCertificates()
            testCerts.clientCertificates.cert.push(Buffer.from(pemCert, 'utf-8'))
            testCerts.clientCertificates.key.push(new PemKey(Buffer.from(pki.privateKeyToPem(certAndKey[1]), 'utf-8'), undefined))
            clientCertificateStoreSingleton.addClientCertificatesForUrl(testCerts)
          } else {
            clientCert = ''
          }

          switch (testCase.option) {
            case 'npm_config_cafile':
              vi.stubEnv('npm_config_cafile', servers.caCertificatePath)
              caContents = [fs.readFileSync(servers.caCertificatePath, 'utf-8')]

              // Ensure the priority picks cafile over the next two options
              vi.stubEnv('npm_config_ca', 'a')
              vi.stubEnv('NODE_EXTRA_CA_CERTS', 'b')
              break
            case 'npm_config_ca':
              caContents = [fs.readFileSync(servers.caCertificatePath, 'utf-8')]
              vi.stubEnv('npm_config_ca', caContents[0])

              // Ensure the priority picks cafile over the next option
              vi.stubEnv('NODE_EXTRA_CA_CERTS', 'b')
              break
            case 'NODE_EXTRA_CA_CERTS':
              vi.stubEnv('NODE_EXTRA_CA_CERTS', servers.caCertificatePath)
              caContents = [fs.readFileSync(servers.caCertificatePath, 'utf-8'), ...tls.rootCertificates]
              break
            default:
              caContents = []
              break
          }

          _resetBaseCaOptionsPromise()

          debugProxy = new DebuggingProxy(options)

          return debugProxy.start(PROXY_PORT)
        })

        afterEach(function () {
          debugProxy.stop()
        })

        it(`Client certificate${testCase.presentClientCertificate ? ' ' : ' not '}presented for https request${testCase.option ? ` with config option ${testCase.option}` : '' }`, async () => {
          const body = await request({
            url: `https://localhost:${HTTPS_PORT}/get`,
          })

          expect(body).toEqual('It worked!')
          if (debugProxy) {
            expect(debugProxy.requests[0]).toEqual(expect.objectContaining({
              https: true,
              url: `localhost:${HTTPS_PORT}`,
            }))
          }

          const socketKey = Object.keys(agent.httpsAgent.sockets).filter((key) => key.includes(`localhost:${HTTPS_PORT}`))

          expect(socketKey, 'There should only be a single localhost TLS Socket').toHaveLength(1)

          // If a client cert has been assigned to a TLS connection, the key for the TLSSocket
          // will include the public certificate
          if (clientCert) {
            expect(socketKey[0], 'A client cert should be used for the TLS Socket').toEqual(expect.stringContaining(clientCert))
          } else {
            expect(socketKey[0], 'A client cert should not be used for the TLS Socket').not.toEqual(clientCert)
          }

          if (caContents.length > 0) {
            expect(socketKey[0], `option: ${testCase.option || 'none'} should be used for the TLS Socket`).toEqual(expect.stringContaining(caContents[0]))
          }
        })

        it(`Client certificate${testCase.presentClientCertificate ? ' ' : ' not '}presented for https websocket`, async function () {
          const socket = socketIo.client(`https://localhost:${HTTPS_PORT}`, {
            // @ts-expect-error
            agent,
            transports: ['websocket'],
            rejectUnauthorized: false,
          })

          const message = await new Promise((resolve) => {
            socket.on('message', resolve)
          })

          expect(message).toEqual('It worked!')
          if (debugProxy) {
            expect(debugProxy.requests[0]).toEqual(expect.objectContaining({
              url: `localhost:${HTTPS_PORT}`,
            }))
          }

          // @ts-expect-error
          socket.close()
        })
      })
    })
  })

  describe('.buildConnectReqHead', function () {
    it('builds the correct request', function () {
      const head = buildConnectReqHead('foo.bar', '1234', {} as url.Url)

      expect(head).toEqual([
        'CONNECT foo.bar:1234 HTTP/1.1',
        'Host: foo.bar:1234',
        '', '',
      ].join('\r\n'))
    })

    it('can do Proxy-Authorization', function () {
      const head = buildConnectReqHead('foo.bar', '1234', {
        auth: 'baz:quux',
      } as url.Url)

      expect(head).toEqual([
        'CONNECT foo.bar:1234 HTTP/1.1',
        'Host: foo.bar:1234',
        'Proxy-Authorization: Basic YmF6OnF1dXg=',
        '', '',
      ].join('\r\n'))
    })
  })

  describe('.createProxySock', function () {
    it('creates a `net` socket for an http url', function () {
      vi.spyOn(net, 'connect')
      const proxy = url.parse('http://foo.bar:1234')

      return new Promise<void>((resolve) => {
        createProxySock({ proxy }, () => {
          expect(net.connect).toHaveBeenCalledWith({ family: 4, host: 'foo.bar', port: 1234 }, expect.any(Function))
          resolve()
        })
      })
    })

    it('creates a `tls` socket for an https url', function () {
      vi.spyOn(tls, 'connect')

      const proxy = url.parse('https://foo.bar:1234')

      return new Promise<void>((resolve) => {
        createProxySock({ proxy }, () => {
          expect(tls.connect).toHaveBeenCalledWith({ family: 4, host: 'foo.bar', port: 1234 }, expect.any(Function))
          resolve()
        })
      })
    })

    it('throws on unsupported proxy protocol', function () {
      const proxy = url.parse('socksv5://foo.bar:1234')

      return new Promise<void>((resolve) => {
        createProxySock({ proxy }, (err) => {
          expect(err.message).toEqual('Unsupported proxy protocol: socksv5:')
          resolve()
        })
      })
    })
  })

  describe('.isRequestHttps', function () {
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
      it(`detects correctly from ${testCase.protocol} requests`, async () => {
        const spy = vi.spyOn(testCase.agent, 'addRequest')

        try {
          await Request({
            url: `${testCase.protocol}://foo.bar.baz.invalid`,
            agent: testCase.agent,
          })

          throw new Error('Shouldn\'t succeed')
        } catch (err) {
          const requestOptions = spy.mock.calls[0][1]

          const isHttpsRequest = isRequestHttps(requestOptions)

          expect(isHttpsRequest).toEqual(testCase.expect)
        }
      })

      it(`detects correctly from ${testCase.protocol} websocket requests`, async () => {
        const spy = vi.spyOn(testCase.agent, 'addRequest')
        const socket = socketIo.client(`${testCase.protocol}://foo.bar.baz.invalid`, {
          agent: testCase.agent as any,
          transports: ['websocket'],
          timeout: 1,
          rejectUnauthorized: false,
        })

        await new Promise((resolve, reject) => {
          socket.on('message', reject)
          // @ts-expect-error
          socket.io.on('error', resolve)
        })

        const requestOptions = spy.mock.calls[0][1]

        const isHttpsRequest = isRequestHttps(requestOptions)

        expect(isHttpsRequest).toEqual(testCase.expect)

        // @ts-expect-error
        socket.close()
      })
    })
  })

  describe('.isResponseStatusCode200', function () {
    it('matches a 200 OK response correctly', function () {
      const result = isResponseStatusCode200('HTTP/1.1 200 Connection established')

      expect(result).toEqual(true)
    })

    it('matches a 500 error response correctly', function () {
      const result = isResponseStatusCode200('HTTP/1.1 500 Internal Server Error')

      expect(result).toEqual(false)
    })
  })

  describe('.regenerateRequestHead', function () {
    it('regenerates changed request head', async () => {
      const spy = vi.spyOn(http.globalAgent, 'createSocket')

      try {
        await Request({
          url: 'http://foo.bar.baz.invalid',
          agent: http.globalAgent,
        })

        throw new Error('this should fail')
      } catch (err) {
        const req = spy.mock.calls[0][0]

        expect(req._header).toEqual([
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
        expect(req._header).toEqual([
          'GET http://quuz.quux.invalid/abc?def=123 HTTP/1.1',
          'Host: foo.fleem.invalid',
          'bing: bang',
          // `keep-alive` was changed to be the default in Node 19:
          // https://nodejs.org/en/blog/announcements/v19-release-announce#https11-keepalive-by-default
          'Connection: keep-alive',
          '', '',
        ].join('\r\n'))
      }
    })
  })

  describe('.getFirstWorkingFamily', () => {
    let servers: http.Server[] = []

    const listen = (options: ListenOptions) => {
      return new Promise((resolve) => {
        const server = http.createServer((req, res) => {
          res.end('Hello, world!')
        })

        servers.push(server)

        server.listen(options, () => resolve(server))
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

    afterEach(async () => {
      await Promise.all(servers.map((server) => {
        return new Promise((resolve) => {
          server.close(resolve)
        })
      }))
    })

    it('caches host + port', async function () {
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

      expect(families).toEqual({
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

      expect(familyCache).toEqual(expectedFamilyCache)
    })

    it('returns from the cache', async () => {
      const familyCache = {
        // not a valid ip family to test it using the cache
        'localhost:2222': 2,
      }

      const family = await getFamilyAsPromise('localhost', 2222, familyCache)

      expect(family).toEqual(2)
    })
  })
})
