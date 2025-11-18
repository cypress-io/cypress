import { it, describe, expect, beforeEach, beforeAll, afterEach, afterAll, vi } from 'vitest'
import path from 'path'
import request from '@cypress/request-promise'
import DebugProxy from '@cypress/debugging-proxy'
import https from 'https'
import net from 'net'
import network from '@packages/network'
import { start as startProxy, stop as stopProxy, reset as resetProxy } from '../helpers/proxy'
import { start as startHttpServer, stop as stopHttpServer } from '../helpers/http_server'
import { start as startHttpsServer, stop as stopHttpsServer } from '../helpers/https_server'
import fs from 'fs/promises'
import { Server } from '../../lib/server'

describe('Proxy', () => {
  let proxy: Server

  // clean out the ca directory before and after all tests
  beforeAll(async function () {
    try {
      await fs.rm(path.join(__dirname, '../', '../', 'ca'), { recursive: true })
    } catch (err) {
      // if the directory does not exist, we can ignore the error
      if (err.code !== 'ENOENT') {
        throw err
      }
    }
  })

  afterAll(async function () {
    try {
      await fs.rm(path.join(__dirname, '../', '../', 'ca'), { recursive: true })
    } catch (err) {
      // if the directory does not exist, we can ignore the error
      if (err.code !== 'ENOENT') {
        throw err
      }
    }
  })

  beforeEach(async function () {
    await Promise.all([
      startHttpServer(),
      startHttpsServer(8443),
      startHttpsServer(8444),
    ])

    proxy = await startProxy(3333)
  })

  afterEach(async () => {
    await Promise.all([
      stopHttpServer(),
      stopHttpsServer(),
      stopProxy(),
    ])
  })

  it('can request the googles', async function () {
    await Promise.all([
      request({
        strictSSL: false,
        proxy: 'http://localhost:3333',
        url: 'https://www.google.com',
      }),

      request({
        strictSSL: false,
        proxy: 'http://localhost:3333',
        url: 'https://mail.google.com',
      }),

      request({
        strictSSL: false,
        proxy: 'http://localhost:3333',
        url: 'https://google.com',
      }),
    ])
    // give some padding to external
    // network request
  }, 10000)

  it('can call the httpsDirectly without a proxy', async () => {
    await request({
      strictSSL: false,
      url: 'https://localhost:8443',
      secureProtocol: 'TLSv1_2_method',
    })
  })

  it('can boot the httpsServer', async () => {
    const html = await request({
      strictSSL: false,
      url: 'https://localhost:8443/',
      proxy: 'http://localhost:3333',
    })

    expect(html).toContain('https server')
  })

  it('yields the onRequest callback', async () => {
    const html = await request({
      strictSSL: false,
      url: 'https://localhost:8443/replace',
      proxy: 'http://localhost:3333',
    })

    expect(html).toContain('replaced content')
  })

  it('closes outgoing connections when client disconnects', async function () {
    const connectSpy = vi.spyOn(net, 'connect')

    await request({
      strictSSL: false,
      url: 'https://localhost:8444/replace',
      proxy: 'http://localhost:3333',
      resolveWithFullResponse: true,
    })

    // ensure the outgoing socket created for this connection was destroyed
    expect(connectSpy).toHaveBeenCalledOnce()
  })

  it('can boot the httpServer', async () => {
    const html = await request({
      strictSSL: false,
      url: 'http://localhost:8080/',
      proxy: 'http://localhost:3333',
    })

    expect(html).toContain('http server')
  })

  describe('generating certificates', { retry: 4 }, function () {
    it('reuses existing certificates', async function () {
      await request({
        strictSSL: false,
        url: 'https://localhost:8443/',
        proxy: 'http://localhost:3333',
      })

      resetProxy()

      // should not generate missing certificates
      let genSpy = vi.spyOn(proxy, '_generateMissingCertificates')

      await request({
        strictSSL: false,
        url: 'https://localhost:8443/',
        proxy: 'http://localhost:3333',
      })

      expect(genSpy).not.toHaveBeenCalled()
    })

    // @see https://github.com/cypress-io/cypress/issues/8705
    it('handles errors with reusing existing certificates', async function () {
      await proxy._ca.removeAll()

      resetProxy()
      let genSpy = vi.spyOn(proxy, '_generateMissingCertificates')

      await request({
        strictSSL: false,
        url: 'https://localhost:8443/',
        proxy: 'http://localhost:3333',
      })

      resetProxy()
      expect(genSpy).toHaveBeenCalledExactlyOnceWith('localhost')

      const privateKeyPath = proxy._ca.getPrivateKeyPath('localhost')
      const key = (await fs.readFile(privateKeyPath)).toString().trim()

      expect(key).toMatch(/^-----BEGIN RSA PRIVATE KEY-----/)
      expect(key).toMatch(/-----END RSA PRIVATE KEY-----$/)

      await fs.writeFile(privateKeyPath, 'some random garbage')

      await request({
        strictSSL: false,
        url: 'https://localhost:8443/',
        proxy: 'http://localhost:3333',
      })

      expect(genSpy).toHaveBeenCalledTimes(2)
      expect(genSpy).toHaveBeenNthCalledWith(1, 'localhost')
      expect(genSpy).toHaveBeenNthCalledWith(2, 'localhost')

      const key2 = (await fs.readFile(privateKeyPath)).toString().trim()

      expect(key2).toMatch(/^-----BEGIN RSA PRIVATE KEY-----/)
      expect(key2).toMatch(/-----END RSA PRIVATE KEY-----$/)
    })

    // https://github.com/cypress-io/cypress/issues/771
    it('generates certs and can proxy requests for HTTPS requests to IPs', async function () {
      let generateMissingCertificatesSpy = vi.spyOn(proxy, '_generateMissingCertificates')
      let getServerPortSpy = vi.spyOn(proxy, '_getServerPortForIp')

      await Promise.all([
        startHttpsServer(8445),
        proxy._ca.removeAll(),
      ])

      await request({
        strictSSL: false,
        url: 'https://127.0.0.1:8445/',
        proxy: 'http://localhost:3333',
      })

      // this should not stand up its own https server
      await request({
        strictSSL: false,
        url: 'https://localhost:8443/',
        proxy: 'http://localhost:3333',
      })

      expect(proxy._ipServers['127.0.0.1']).toBeInstanceOf(https.Server)
      expect(getServerPortSpy).toHaveBeenCalledExactlyOnceWith('127.0.0.1', expect.any(Object))

      expect(generateMissingCertificatesSpy).toHaveBeenCalledTimes(2)
    }, 5000)

    // https://github.com/cypress-io/cypress/issues/9220
    it('handles errors with addContext', async function () {
      let connectSpy = vi.spyOn(proxy, 'connect')

      vi.spyOn(proxy._sniServer, 'addContext').mockImplementation(() => {
        throw new Error('error adding context')
      })

      try {
        await request({
          strictSSL: false,
          url: 'https://localhost:8443/',
          proxy: 'http://localhost:3333',
        })

        throw new Error('should not reach here')
      } catch (err) {
        expect(err.message).toMatch(/Client network socket disconnected before secure TLS connection was established/)
        // This scenario will cause an error but we should clean
        // ensure the outgoing socket created for this connection was destroyed
        expect(connectSpy).toHaveBeenCalledOnce()

        const socket = connectSpy.mock.calls[0][1]

        expect(socket.destroyed).toBe(true)
      }
    })
  })

  describe('closing', () => {
    it('resets sslServers and can reopen', async function () {
      await request({
        strictSSL: false,
        url: 'https://localhost:8443/',
        proxy: 'http://localhost:3333',
      })

      await stopProxy()
      await startProxy(3333)

      // make sure missing certificates are not generated and are reused
      let generateMissingCertificatesSpy = vi.spyOn(proxy, '_generateMissingCertificates')

      await request({
        strictSSL: false,
        url: 'https://localhost:8443/',
        proxy: 'http://localhost:3333',
      })

      expect(generateMissingCertificatesSpy).not.toHaveBeenCalled()
    })
  })

  describe('with an upstream proxy', () => {
    let upstream: DebugProxy

    beforeEach(function () {
      vi.unstubAllEnvs()
      // PROXY vars should override npm_config vars, so set them to cause failures if they are used
      // @see https://github.com/cypress-io/cypress/pull/8295
      vi.stubEnv('npm_config_proxy', 'http://erroneously-used-npm-proxy.invalid')
      vi.stubEnv('npm_config_https_proxy', 'http://erroneously-used-npm-proxy.invalid')
      vi.stubEnv('npm_config_noproxy', 'just,some,nonsense')
      vi.stubEnv('NO_PROXY', '')
      vi.stubEnv('HTTP_PROXY', 'http://localhost:2222')
      vi.stubEnv('HTTPS_PROXY', 'http://localhost:2222')

      upstream = new DebugProxy({
        keepRequests: true,
      })

      return upstream.start(2222)
    })

    afterEach(async function () {
      await upstream.stop()
    })

    it('passes a request to an https server through the upstream', async function () {
      upstream._onConnect = function (domain, port) {
        expect(domain).toEqual('localhost')
        expect(port).toEqual('8444')

        return true
      }

      const res = await request({
        strictSSL: false,
        url: 'https://localhost:8444/',
        proxy: 'http://localhost:3333',
      })

      expect(res).toContain('https server')
    })

    it('uses HTTP basic auth when provided', async function () {
      upstream.setAuth({
        username: 'foo',
        password: 'bar',
      })

      upstream._onConnect = function (domain, port) {
        expect(domain).toEqual('localhost')
        expect(port).toEqual('8444')

        return true
      }

      vi.stubEnv('HTTP_PROXY', 'http://foo:bar@localhost:2222')
      vi.stubEnv('HTTPS_PROXY', 'http://foo:bar@localhost:2222')

      const res = await request({
        strictSSL: false,
        url: 'https://localhost:8444/',
        proxy: 'http://localhost:3333',
      })

      expect(res).toContain('https server')
    })

    it('closes outgoing connections when client disconnects', async function () {
      const connectSpy = vi.spyOn(net, 'connect')

      await request({
        strictSSL: false,
        url: 'https://localhost:8444/replace',
        proxy: 'http://localhost:3333',
        resolveWithFullResponse: true,
        forever: false,
      })

      // ensure the outgoing socket created for this connection was destroyed
      expect(connectSpy).toHaveBeenCalledOnce()
    })

    // https://github.com/cypress-io/cypress/issues/4257
    it('passes through to SNI when it is intercepted and not through proxy', async function () {
      const createSocket = vi.spyOn(network.connect, 'createRetryingSocket').mockImplementation((_, cb) => {
        cb(new Error('stub'))
      })
      const createProxyConn = vi.spyOn(network.agent.httpsAgent, 'createUpstreamProxyConnection')

      try {
        await request({
          strictSSL: false,
          url: 'https://localhost:8443',
          proxy: 'http://localhost:3333',
          resolveWithFullResponse: true,
          forever: false,
        })

        throw new Error('should not succeed')
      } catch (err) {
        expect(err.message).toContain('Client network socket disconnected before secure TLS connection was established')

        expect(createProxyConn).not.toHaveBeenCalled()

        expect(createSocket).toHaveBeenCalledWith({
          port: proxy._sniPort,
          host: 'localhost',
        }, expect.any(Function))
      }
    })
  })
})
