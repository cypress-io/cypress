require('../spec_helper')

const morganFn = function () {}

mockery.registerMock('morgan', () => {
  return morganFn
})

const _ = require('lodash')
const os = require('os')
const express = require('express')
const Promise = require('bluebird')
const { connect } = require('@packages/network')
const { setupFullConfigWithDefaults } = require('@packages/config')
const { ServerBase } = require(`../../lib/server-base`)
const { SocketE2E } = require(`../../lib/socket-e2e`)
const fileServer = require(`../../lib/file_server`)
const ensureUrl = require(`../../lib/util/ensure-url`)
const { getCtx } = require('@packages/data-context')

function getOpenOptions (overrides = {}) {
  return {
    SocketCtor: SocketE2E,
    testingType: 'e2e',
    onError: sinon.stub(),
    onWarning: sinon.stub(),
    getCurrentBrowser: () => null,
    getSpec: () => null,
    shouldCorrelatePreRequests: () => false,
    ...overrides,
  }
}

describe('lib/server-base', () => {
  beforeEach(function () {
    this.fileServer = {
      close () {},
      port () {
        return 1111
      },
    }

    sinon.stub(fileServer, 'create').returns(this.fileServer)

    return setupFullConfigWithDefaults({ projectRoot: '/foo/bar/', config: { supportFile: false } }, getCtx().file.getFilesByGlob)
    .then((cfg) => {
      this.config = cfg
      this.server = new ServerBase(cfg)

      this.oldFileServer = this.server._fileServer
      this.server._fileServer = this.fileServer
    })
  })

  afterEach(function () {
    return this.server && this.server.close()
  })

  context('#createExpressApp', () => {
    beforeEach(function () {
      this.use = sinon.spy(express.application, 'use')
    })

    it('instantiates express instance without morgan', function () {
      const app = this.server.createExpressApp({ morgan: false })

      expect(app.get('view engine')).to.eq('html')

      expect(this.use).not.to.be.calledWith(morganFn)
    })

    it('requires morgan if true', function () {
      const useMorganStub = sinon.stub(this.server, 'useMorgan').returns(morganFn)

      this.server.createExpressApp({ morgan: true })

      expect(useMorganStub).to.have.been.calledOnce
    })
  })

  context('#open', () => {
    beforeEach(function () {
      sinon.stub(this.server, 'createServer').resolves()
    })

    it('calls #createExpressApp with morgan', function () {
      sinon.spy(this.server, 'createExpressApp')
      _.extend(this.config, { port: 54321, morgan: false })

      return this.server.open(this.config, getOpenOptions())
      .then(() => {
        expect(this.server.createExpressApp).to.be.calledWithMatch({ morgan: false })
      })
    })

    it('calls #createServer with app and config', function () {
      _.extend(this.config, { port: 54321 })
      const app = { use: sinon.stub() }

      sinon.stub(this.server, 'createExpressApp').returns(app)

      return this.server.open(this.config, getOpenOptions())
      .then(() => {
        expect(this.server.createServer).to.have.been.calledWith(app, this.config, sinon.match.func)
      })
    })
  })

  context('#createServer', () => {
    beforeEach(function () {
      this.port = 54321
      this.app = this.server.createExpressApp({ morgan: true })
    })

    context('remote state', () => {
      beforeEach(function () {
        sinon.stub(this.server, '_listen').callsFake((port) => Promise.resolve(port))
        sinon.stub(this.server, '_port').returns(this.port)
      })

      it('sets remote state to baseUrl when baseUrl is provided', function () {
        sinon.stub(ensureUrl, 'isListening').resolves()
        const setSpy = sinon.spy(this.server._remoteStates, 'set')

        return this.server.createServer(this.app, { port: this.port, baseUrl: 'http://localhost:9999' })
        .spread(() => {
          expect(setSpy).to.have.been.calledWith('http://localhost:9999')
        })
      })

      it('sets remote state to <root> when baseUrl is not provided', function () {
        const setSpy = sinon.spy(this.server._remoteStates, 'set')

        return this.server.createServer(this.app, { port: this.port })
        .spread(() => {
          expect(setSpy).to.have.been.calledWith('<root>')
        })
      })
    })

    it('isListening=true', function () {
      return this.server.createServer(this.app, { port: this.port })
      .then(() => {
        expect(this.server.isListening).to.be.true
      })
    })

    it('resolves with http server port', function () {
      return this.server.createServer(this.app, { port: this.port })
      .spread((port) => {
        expect(port).to.eq(this.port)
      })
    })

    it('all servers listen only on localhost and no other interface', function () {
      let interfaces

      try {
        interfaces = _.flatten(_.values(os.networkInterfaces()))
      } catch (e) {
        this.skip()
      }

      const nonLoopback = interfaces.find((iface) => {
        return (iface.family === 'IPv4') && (iface.address !== '127.0.0.1')
      })

      if (!nonLoopback) {
        this.skip()
      }

      fileServer.create.restore()
      this.server._fileServer = this.oldFileServer

      // byPortAndAddress has no timeout; connecting to non-loopback with nothing listening
      // can hang until TCP timeout. Cap wait so the test doesn't hang.
      const connectTimeoutMs = 1000

      // verify that we can connect to `port` over loopback
      // and not over another configured IPv4 address
      const tryOnlyLoopbackConnect = (port) => {
        const nonLoopbackAttempt = Promise.race([
          connect.byPortAndAddress(port, nonLoopback),
          new Promise((_, reject) => setTimeout(() => reject(new Error('connect timeout')), connectTimeoutMs)),
        ])

        return Promise.all([
          connect.byPortAndAddress(port, '127.0.0.1'),
          nonLoopbackAttempt
          .then(() => {
            throw new Error(`Shouldn't be able to connect on ${nonLoopback.address}:${port}`)
          }).catch((err) => {
            if (err.code === 'ECONNREFUSED' || err.message === 'connect timeout') return

            throw err
          }),
        ])
      }

      return this.server.createServer(this.app, {})
      .spread((port) => {
        return Promise.map(
          [
            port,
            this.server._fileServer.port(),
            this.server._httpsProxy._sniPort,
          ],
          tryOnlyLoopbackConnect,
        )
      })
    })

    it('resolves with warning if cannot connect to baseUrl', function () {
      sinon.stub(ensureUrl, 'isListening').rejects()

      return this.server.createServer(this.app, { port: this.port, baseUrl: `http://localhost:${this.port}` })
      .spread((port, warning) => {
        expect(warning.type).to.eq('CANNOT_CONNECT_BASE_URL_WARNING')

        expect(warning.message).to.include(this.port)
      })
    })

    context('errors', () => {
      it('rejects with portInUse', function () {
        return this.server.createServer(this.app, { port: this.port })
        .then(() => {
          return this.server.createServer(this.app, { port: this.port })
        }).then(() => {
          throw new Error('should have failed but didn\'t')
        }).catch((err) => {
          expect(err.type).to.eq('PORT_IN_USE_SHORT')

          expect(err.message).to.include(this.port)
        })
      })
    })
  })

  context('#end', () => {
    it('calls this._socket.end', function () {
      const socket = sinon.stub({
        end () {},
        close () {},
      })

      this.server._socket = socket

      this.server.end()

      expect(socket.end).to.be.called
    })

    it('is noop without this._socket', function () {
      return this.server.end()
    })
  })

  context('#startWebsockets', () => {
    beforeEach(function () {
      this.startListening = sinon.stub(SocketE2E.prototype, 'startListening')
    })

    it('sets _socket and calls _socket#startListening', function () {
      return this.server.open(this.config, getOpenOptions())
      .then(() => {
        const arg2 = {}

        this.server.startWebsockets(1, 2, arg2)

        expect(this.startListening).to.be.calledWith(this.server.getHttpServer(), 1, 2, arg2)
      })
    })
  })

  context('#reset', () => {
    beforeEach(function () {
      return this.server.open(this.config, getOpenOptions())
      .then(() => {
        this.buffers = this.server._networkProxy.http

        return sinon.stub(this.buffers, 'reset')
      })
    })

    it('resets the buffers', function () {
      this.server.reset()

      expect(this.buffers.reset).to.be.called
    })

    it('sets the domain to the previous base url if set', function () {
      this.server._baseUrl = 'http://localhost:3000'
      this.server.reset()

      expect(this.server._remoteStates.current().strategy).to.equal('http')
    })

    it('sets the domain to <root> if not set', function () {
      this.server.reset()

      expect(this.server._remoteStates.current().strategy).to.equal('file')
    })
  })

  context('#close', () => {
    it('resolves true successfully bailing out early', function () {
      return this.server.close().then((res) => {
        expect(res[0]).to.be.true
      })
    })

    it('returns a promise', function () {
      expect(this.server.close()).to.be.instanceof(Promise)
    })

    it('calls close on this.server', function () {
      return this.server.open(this.config, getOpenOptions())
      .then(() => {
        return this.server.close()
      })
    })

    it('isListening=false', function () {
      return this.server.open(this.config, getOpenOptions())
      .then(() => {
        return this.server.close()
      }).then(() => {
        expect(this.server.isListening).to.be.false
      })
    })

    it('calls close on this._socket', function () {
      this.server._socket = { close: sinon.spy() }

      return this.server.close()
      .then(() => {
        expect(this.server._socket.close).to.be.calledOnce
      })
    })
  })

  context('#proxyWebsockets', () => {
    beforeEach(function () {
      this.proxy = sinon.stub({
        ws () {},
        on () {},
      })

      this.socket = sinon.stub({ end () {} })
      this.head = {}
    })

    it('is noop if req.url startsWith socketIoRoute', function () {
      const remotePort = 12345
      const req = {
        url: '/foobarbaz',
        socket: { remotePort, remoteAddress: '127.0.0.1' },
      }

      this.server.socketAllowed.add({
        localPort: remotePort,
        once: _.noop,
      })

      const noop = this.server.proxyWebsockets(this.proxy, '/foo', req, this.socket, this.head)

      expect(noop).to.be.undefined
    })

    it('calls proxy.ws with hostname + port', function () {
      this.server.remoteStates.set('https://www.google.com')

      const req = {
        connection: {
          encrypted: true,
        },
        url: '/',
        headers: {
          host: 'www.google.com',
        },
      }

      this.server.proxyWebsockets(this.proxy, '/foo', req, this.socket, this.head)

      expect(this.proxy.ws).to.be.calledWithMatch(req, this.socket, this.head, {
        secure: false,
        target: {
          host: 'www.google.com',
          port: '443',
          protocol: 'https:',
        },
      })
    })

    it('ends the socket if its writable and there is no __cypress.remoteHost', function () {
      const req = {
        url: '/',
        headers: {
          cookie: 'foo=bar',
        },
      }

      this.server.proxyWebsockets(this.proxy, '/foo', req, this.socket, this.head)
      expect(this.socket.end).not.to.be.called

      this.socket.writable = true
      this.server.proxyWebsockets(this.proxy, '/foo', req, this.socket, this.head)

      expect(this.socket.end).to.be.called
    })
  })
})
