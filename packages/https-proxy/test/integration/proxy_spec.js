process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const { request, expect } = require('../spec_helper')
const DebugProxy = require('@cypress/debugging-proxy')
const https = require('https')
const net = require('net')
const network = require('@packages/network')
const Promise = require('bluebird')
const proxy = require('../helpers/proxy')
const httpServer = require('../helpers/http_server')
const httpsServer = require('../helpers/https_server')
const fs = require('fs').promises

describe('Proxy', () => {
  beforeEach(function () {
    return Promise.join(
      httpServer.start(),

      httpsServer.start(8443),

      httpsServer.start(8444),

      proxy.start(3333)
      .then((proxy1) => {
        this.proxy = proxy1
      }),
    )
  })

  afterEach(() => {
    return Promise.join(
      httpServer.stop(),
      httpsServer.stop(),
      proxy.stop(),
    )
  })

  it('can request the googles', function () {
    // give some padding to external
    // network request
    this.timeout(10000)

    return Promise.all([
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
  })

  it('can call the httpsDirectly without a proxy', () => {
    return request({
      strictSSL: false,
      url: 'https://localhost:8443',
    })
  })

  it('can boot the httpsServer', () => {
    return request({
      strictSSL: false,
      url: 'https://localhost:8443/',
      proxy: 'http://localhost:3333',
    })
    .then((html) => {
      expect(html).to.include('https server')
    })
  })

  it('yields the onRequest callback', () => {
    return request({
      strictSSL: false,
      url: 'https://localhost:8443/replace',
      proxy: 'http://localhost:3333',
    })
    .then((html) => {
      expect(html).to.include('replaced content')
    })
  })

  it('closes outgoing connections when client disconnects', async function () {
    this.sandbox.spy(net, 'connect')

    await request({
      strictSSL: false,
      url: 'https://localhost:8444/replace',
      proxy: 'http://localhost:3333',
      resolveWithFullResponse: true,
    })

    // ensure the outgoing socket created for this connection was destroyed
    expect(net.connect).calledOnce

    const socket = net.connect.getCalls()[0].returnValue

    // sometimes the close event happens before we can attach the listener, causing this test to flake
    if (!socket.destroyed || !socket.readyState === 'closed') {
      await new Promise((resolve) => {
        socket.on('close', () => {
          expect(socket.destroyed).to.be.true

          resolve()
        })
      })
    }
  })

  it('can boot the httpServer', () => {
    return request({
      strictSSL: false,
      url: 'http://localhost:8080/',
      proxy: 'http://localhost:3333',
    })

    .then((html) => {
      expect(html).to.include('http server')
    })
  })

  context('generating certificates', function () {
    this.retries(4)

    it('reuses existing certificates', function () {
      return request({
        strictSSL: false,
        url: 'https://localhost:8443/',
        proxy: 'http://localhost:3333',
      })
      .then(() => {
        proxy.reset()

        // force this to reject if its called
        this.sandbox.stub(this.proxy, '_generateMissingCertificates').rejects(new Error('should not call'))

        return request({
          strictSSL: false,
          url: 'https://localhost:8443/',
          proxy: 'http://localhost:3333',
        })
      })
    })

    // @see https://github.com/cypress-io/cypress/issues/8705
    it('handles errors with reusing existing certificates', async function () {
      await this.proxy._ca.removeAll()

      proxy.reset()
      const genSpy = this.sandbox.spy(this.proxy, '_generateMissingCertificates')

      await request({
        strictSSL: false,
        url: 'https://localhost:8443/',
        proxy: 'http://localhost:3333',
      })

      proxy.reset()
      expect(genSpy).to.be.calledWith('localhost').and.calledOnce

      const privateKeyPath = this.proxy._ca.getPrivateKeyPath('localhost')
      const key = (await fs.readFile(privateKeyPath)).toString().trim()

      expect(key).to.match(/^-----BEGIN RSA PRIVATE KEY-----/)
      .and.match(/-----END RSA PRIVATE KEY-----$/)

      await fs.writeFile(privateKeyPath, 'some random garbage')

      await request({
        strictSSL: false,
        url: 'https://localhost:8443/',
        proxy: 'http://localhost:3333',
      })

      expect(genSpy).to.always.have.been.calledWith('localhost').and.calledTwice

      const key2 = (await fs.readFile(privateKeyPath)).toString().trim()

      expect(key2).to.match(/^-----BEGIN RSA PRIVATE KEY-----/)
      .and.match(/-----END RSA PRIVATE KEY-----$/)
    })

    // https://github.com/cypress-io/cypress/issues/771
    it('generates certs and can proxy requests for HTTPS requests to IPs', function () {
      this.timeout(5000)

      this.sandbox.spy(this.proxy, '_generateMissingCertificates')
      this.sandbox.spy(this.proxy, '_getServerPortForIp')

      return Promise.all([
        httpsServer.start(8445),
        this.proxy._ca.removeAll(),
      ])
      .then(() => {
        return request({
          strictSSL: false,
          url: 'https://127.0.0.1:8445/',
          proxy: 'http://localhost:3333',
        })
      }).then(() => {
        // this should not stand up its own https server
        return request({
          strictSSL: false,
          url: 'https://localhost:8443/',
          proxy: 'http://localhost:3333',
        })
      }).then(() => {
        expect(this.proxy._ipServers['127.0.0.1']).to.be.an.instanceOf(https.Server)
        expect(this.proxy._getServerPortForIp).to.be.calledWith('127.0.0.1').and.be.calledOnce

        expect(this.proxy._generateMissingCertificates).to.be.calledTwice
      })
    })

    // https://github.com/cypress-io/cypress/issues/9220
    it('handles errors with addContext', async function () {
      this.sandbox.spy(this.proxy, 'connect')
      this.sandbox.stub(this.proxy._sniServer, 'addContext').throws(new Error('error adding context'))

      return request({
        strictSSL: false,
        url: 'https://localhost:8443/',
        proxy: 'http://localhost:3333',
      }).catch(() => {
        // This scenario will cause an error but we should clean
        // ensure the outgoing socket created for this connection was destroyed
        expect(this.proxy.connect).calledOnce
        const socket = this.proxy.connect.getCalls()[0].args[1]

        expect(socket.destroyed).to.be.true
      })
    })
  })

  context('closing', () => {
    it('resets sslServers and can reopen', function () {
      return request({
        strictSSL: false,
        url: 'https://localhost:8443/',
        proxy: 'http://localhost:3333',
      })
      .then(() => {
        return proxy.stop()
      }).then(() => {
        return proxy.start(3333)
      }).then(() => {
        // force this to reject if its called
        this.sandbox.stub(this.proxy, '_generateMissingCertificates').rejects(new Error('should not call'))

        return request({
          strictSSL: false,
          url: 'https://localhost:8443/',
          proxy: 'http://localhost:3333',
        })
      })
    })
  })

  context('with an upstream proxy', () => {
    beforeEach(function () {
      // PROXY vars should override npm_config vars, so set them to cause failures if they are used
      // @see https://github.com/cypress-io/cypress/pull/8295
      process.env.npm_config_proxy = process.env.npm_config_https_proxy = 'http://erroneously-used-npm-proxy.invalid'
      process.env.npm_config_noproxy = 'just,some,nonsense'

      process.env.NO_PROXY = ''
      process.env.HTTP_PROXY = process.env.HTTPS_PROXY = 'http://localhost:2222'

      this.upstream = new DebugProxy({
        keepRequests: true,
      })

      return this.upstream.start(2222)
    })

    it('passes a request to an https server through the upstream', function () {
      this.upstream._onConnect = function (domain, port) {
        expect(domain).to.eq('localhost')
        expect(port).to.eq('8444')

        return true
      }

      return request({
        strictSSL: false,
        url: 'https://localhost:8444/',
        proxy: 'http://localhost:3333',
      }).then((res) => {
        expect(res).to.contain('https server')
      })
    })

    it('uses HTTP basic auth when provided', function () {
      this.upstream.setAuth({
        username: 'foo',
        password: 'bar',
      })

      this.upstream._onConnect = function (domain, port) {
        expect(domain).to.eq('localhost')
        expect(port).to.eq('8444')

        return true
      }

      process.env.HTTP_PROXY = process.env.HTTPS_PROXY = 'http://foo:bar@localhost:2222'

      return request({
        strictSSL: false,
        url: 'https://localhost:8444/',
        proxy: 'http://localhost:3333',
      }).then((res) => {
        expect(res).to.contain('https server')
      })
    })

    it('closes outgoing connections when client disconnects', async function () {
      this.sandbox.spy(net, 'connect')

      await request({
        strictSSL: false,
        url: 'https://localhost:8444/replace',
        proxy: 'http://localhost:3333',
        resolveWithFullResponse: true,
        forever: false,
      })

      // ensure the outgoing socket created for this connection was destroyed
      expect(net.connect).calledOnce
      const socket = net.connect.getCalls()[0].returnValue

      // sometimes the close event happens before we can attach the listener, causing this test to flake
      if (!socket.destroyed || !socket.readyState === 'closed') {
        await new Promise((resolve) => {
          socket.on('close', () => {
            expect(socket.destroyed).to.be.true

            resolve()
          })
        })
      }
    })

    // https://github.com/cypress-io/cypress/issues/4257
    it('passes through to SNI when it is intercepted and not through proxy', function () {
      const createSocket = this.sandbox.stub(network.connect, 'createRetryingSocket').callsArgWith(1, new Error('stub'))
      const createProxyConn = this.sandbox.spy(network.agent.httpsAgent, 'createUpstreamProxyConnection')

      return request({
        strictSSL: false,
        url: 'https://localhost:8443',
        proxy: 'http://localhost:3333',
        resolveWithFullResponse: true,
        forever: false,
      })
      .then(() => {
        throw new Error('should not succeed')
      }).catch({ message: 'Error: Client network socket disconnected before secure TLS connection was established' }, () => {
        expect(createProxyConn).to.not.be.called

        expect(createSocket).to.be.calledWith({
          port: this.proxy._sniPort,
          host: 'localhost',
        })
      })
    })

    return afterEach(function () {
      this.upstream.stop()
      delete process.env.HTTP_PROXY
      delete process.env.HTTPS_PROXY

      delete process.env.NO_PROXY
    })
  })
})
