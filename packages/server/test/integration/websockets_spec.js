process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
require('../spec_helper')

const ws = require('ws')
const httpsProxyAgent = require('https-proxy-agent')
const evilDns = require('evil-dns')
const Promise = require('bluebird')
const socketIo = require(`${root}../socket`)
const httpsServer = require(`${root}../https-proxy/test/helpers/https_server`)
const config = require(`${root}lib/config`)
const Server = require(`${root}lib/server`)
const Automation = require(`${root}lib/automation`)
const Fixtures = require(`${root}/test/support/helpers/fixtures`)

const cyPort = 12345
const otherPort = 55551
const wsPort = 20000
const wssPort = 8443

describe('Web Sockets', () => {
  require('mocha-banner').register()

  beforeEach(function () {
    Fixtures.scaffold()

    this.idsPath = Fixtures.projectPath('ids')

    return config.get(this.idsPath, { port: cyPort })
    .then((cfg) => {
      this.cfg = cfg
      this.ws = new ws.Server({ port: wsPort })

      this.server = new Server()

      return this.server.open(this.cfg)
      .then(() => {
        return httpsServer.start(wssPort)
      }).then((httpsSrv) => {
        this.wss = new ws.Server({ server: httpsSrv })
      })
    })
  })

  afterEach(function () {
    Fixtures.remove()

    evilDns.clear()

    this.ws.close()
    this.wss.close()

    return Promise.join(
      this.server.close(),
      httpsServer.stop(),
    )
  })

  context('proxying external websocket requests', () => {
    it('sends back ECONNRESET when error upgrading', function (done) {
      const agent = new httpsProxyAgent(`http://localhost:${cyPort}`)

      this.server._onDomainSet(`http://localhost:${otherPort}`)

      const client = new ws(`ws://localhost:${otherPort}`, {
        agent,
      })

      return client.on('error', (err) => {
        expect(err.code).to.eq('ECONNRESET')
        expect(err.message).to.eq('socket hang up')

        return done()
      })
    })

    it('proxies https messages', function (done) {
      const agent = new httpsProxyAgent(`http://localhost:${cyPort}`, {
      })

      this.wss.on('connection', (c) => {
        return c.on('message', (msg) => {
          return c.send(`response:${msg}`)
        })
      })

      const client = new ws(`wss://localhost:${wssPort}`, {
        rejectUnauthorized: false,
        agent,
      })

      client.on('message', (data) => {
        expect(data).to.eq('response:foo')

        return done()
      })

      return client.on('open', () => {
        return client.send('foo')
      })
    })

    it('proxies http messages through http proxy', function (done) {
      // force node into legit proxy mode like a browser
      const agent = new httpsProxyAgent(`http://localhost:${cyPort}`)

      this.server._onDomainSet(`http://localhost:${wsPort}`)

      this.ws.on('connection', (c) => {
        return c.on('message', (msg) => {
          return c.send(`response:${msg}`)
        })
      })

      const client = new ws(`ws://localhost:${wsPort}`, {
        agent,
      })

      client.on('message', (data) => {
        expect(data).to.eq('response:foo')

        return done()
      })

      return client.on('open', () => {
        return client.send('foo')
      })
    })

    it('proxies https messages through http', function (done) {
      // force node into legit proxy mode like a browser
      const agent = new httpsProxyAgent({
        host: 'localhost',
        port: cyPort,
        rejectUnauthorized: false,
      })

      this.server._onDomainSet(`https://localhost:${wssPort}`)

      this.wss.on('connection', (c) => {
        return c.on('message', (msg) => {
          return c.send(`response:${msg}`)
        })
      })

      const client = new ws(`wss://localhost:${wssPort}`, {
        agent,
      })

      client.on('message', (data) => {
        expect(data).to.eq('response:foo')

        return done()
      })

      return client.on('open', () => {
        return client.send('foo')
      })
    })

    it('proxies through subdomain by using host header', function (done) {
      // we specifically only allow remote connections
      // to ws.foobar.com since that is where the websocket
      // server is mounted and this tests that we make
      // a connection to the right host instead of the
      // origin (which isnt ws.foobar.com)
      nock.enableNetConnect('ws.foobar.com')

      evilDns.add('ws.foobar.com', '127.0.0.1')

      // force node into legit proxy mode like a browser
      const agent = new httpsProxyAgent({
        host: 'localhost',
        port: cyPort,
        rejectUnauthorized: false,
      })

      this.server._onDomainSet(`https://foobar.com:${wssPort}`)

      this.wss.on('connection', (c) => {
        return c.on('message', (msg) => {
          return c.send(`response:${msg}`)
        })
      })

      const client = new ws(`wss://ws.foobar.com:${wssPort}`, {
        agent,
      })

      client.on('message', (data) => {
        expect(data).to.eq('response:foo')

        return done()
      })

      return client.on('open', () => {
        return client.send('foo')
      })
    })
  })

  context('socket.io handling', () => {
    beforeEach(function () {
      this.automation = Automation.create(this.cfg.namespace, this.cfg.socketIoCookie, this.cfg.screenshotsFolder)

      return this.server.startWebsockets(this.automation, this.cfg, {})
    })

    const testSocketIo = function (wsUrl, beforeFn) {
      context('behind Cy proxy', () => {
        beforeEach(function (done) {
          // force node into legit proxy mode like a browser
          const agent = new httpsProxyAgent(`http://localhost:${cyPort}`)

          if (beforeFn != null) {
            beforeFn.call(this)
          }

          this.wsClient = socketIo.client(wsUrl || this.cfg.proxyUrl, {
            agent,
            path: this.cfg.socketIoRoute,
            transports: ['websocket'],
            parser: socketIo.circularParser,
            rejectUnauthorized: false,
          })

          return this.wsClient.on('connect', () => {
            return done()
          })
        })

        afterEach(function () {
          return this.wsClient.disconnect()
        })

        it('continues to handle socket.io requests just fine', function (done) {
          return this.wsClient.emit('backend:request', 'get:fixture', 'example.json', {}, (data) => {
            expect(data.response).to.deep.eq({ foo: 'bar' })

            return done()
          })
        })
      })

      context('without Cy proxy', () => {
        beforeEach(function () {
          return (beforeFn != null ? beforeFn.call(this) : undefined)
        })

        afterEach(function () {
          return this.wsClient.disconnect()
        })

        it('fails to connect via websocket', function (done) {
          this.wsClient = socketIo.client(wsUrl || this.cfg.proxyUrl, {
            path: this.cfg.socketIoRoute,
            transports: ['websocket'],
            parser: socketIo.circularParser,
            rejectUnauthorized: false,
            reconnection: false,
          })

          this.wsClient.on('connect', () => {
            return done(new Error('should not have been able to connect'))
          })

          return this.wsClient.on('connect_error', () => {
            return done()
          })
        })

        it('fails to connect via polling', function (done) {
          this.wsClient = socketIo.client(wsUrl || this.cfg.proxyUrl, {
            path: this.cfg.socketIoRoute,
            transports: ['polling'],
            parser: socketIo.circularParser,
            rejectUnauthorized: false,
            reconnection: false,
          })

          this.wsClient.on('connect', () => {
            return done(new Error('should not have been able to connect'))
          })

          return this.wsClient.on('connect_error', () => {
            return done()
          })
        })
      })
    }

    context('http', () => {
      return testSocketIo()
    })

    context('when http superDomain has been set', () => {
      return testSocketIo(`http://localhost:${otherPort}`, function () {
        return this.server._onDomainSet(`http://localhost:${otherPort}`)
      })
    })

    context('when https superDomain has been set', () => {
      return testSocketIo(`http://localhost:${wssPort}`, function () {
        return this.server._onDomainSet(`http://localhost:${wssPort}`)
      })
    })
  })
})
