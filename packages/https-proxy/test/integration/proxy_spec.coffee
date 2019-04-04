require("../spec_helper")

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

_           = require("lodash")
DebugProxy  = require("@cypress/debugging-proxy")
net         = require("net")
path        = require("path")
Promise     = require("bluebird")
proxy       = require("../helpers/proxy")
httpServer  = require("../helpers/http_server")
httpsServer = require("../helpers/https_server")

describe "Proxy", ->
  beforeEach ->
    Promise.join(
      httpServer.start()

      httpsServer.start(8443)

      httpsServer.start(8444)

      proxy.start(3333)
      .then (@proxy) =>
    )

  afterEach ->
    Promise.join(
      httpServer.stop()
      httpsServer.stop()
      proxy.stop()
    )

  it "can request the googles", ->
    ## give some padding to external
    ## network request
    @timeout(10000)

    Promise.all([
      request({
        strictSSL: false
        proxy: "http://localhost:3333"
        url: "https://www.google.com"
      })

      request({
        strictSSL: false
        proxy: "http://localhost:3333"
        url: "https://mail.google.com"
      })

      request({
        strictSSL: false
        proxy: "http://localhost:3333"
        url: "https://google.com"
      })
    ])

  it "can call the httpsDirectly without a proxy", ->
    request({
      strictSSL: false
      url: "https://localhost:8443"
    })

  it "can boot the httpsServer", ->
    request({
      strictSSL: false
      url: "https://localhost:8443/"
      proxy: "http://localhost:3333"
    })
    .then (html) ->
      expect(html).to.include("https server")

  it "yields the onRequest callback", ->
    request({
      strictSSL: false
      url: "https://localhost:8443/replace"
      proxy: "http://localhost:3333"
    })
    .then (html) ->
      expect(html).to.include("replaced content")

  it "can pass directly through", ->
    ## this will fail due to dynamic cert
    ## generation when strict ssl is true
    request({
      strictSSL: false
      url: "https://localhost:8444/replace"
      proxy: "http://localhost:3333"
    })
    .then (html) ->
      expect(html).to.include("https server")

  it "closes outgoing connections when client disconnects", ->
    @sandbox.spy(net.Socket.prototype, 'connect')

    request({
      strictSSL: false
      url: "https://localhost:8444/replace"
      proxy: "http://localhost:3333"
      resolveWithFullResponse: true
    })
    .then (res) =>
      ## ensure client has disconnected
      expect(res.socket.destroyed).to.be.true
      ## ensure the outgoing socket created for this connection was destroyed
      socket = net.Socket.prototype.connect.getCalls()
      .find (call) =>
        _.isEqual(call.args.slice(0,2), ["8444", "localhost"])
      .thisValue
      expect(socket.destroyed).to.be.true

  it "can boot the httpServer", ->
    request({
      strictSSL: false
      url: "http://localhost:8080/"
      proxy: "http://localhost:3333"
    })
    .then (html) ->
      expect(html).to.include("http server")

  context "generating certificates", ->
    it "reuses existing certificates", ->
      request({
        strictSSL: false
        url: "https://localhost:8443/"
        proxy: "http://localhost:3333"
      })
      .then =>
        proxy.reset()

        ## force this to reject if its called
        @sandbox.stub(@proxy, "_generateMissingCertificates").rejects(new Error("should not call"))

        request({
          strictSSL: false
          url: "https://localhost:8443/"
          proxy: "http://localhost:3333"
        })

  context "closing", ->
    it "resets sslServers and can reopen", ->
      request({
        strictSSL: false
        url: "https://localhost:8443/"
        proxy: "http://localhost:3333"
      })
      .then =>
        proxy.stop()
      .then =>
        proxy.start(3333)
      .then =>
        ## force this to reject if its called
        @sandbox.stub(@proxy, "_generateMissingCertificates").rejects(new Error("should not call"))

        request({
          strictSSL: false
          url: "https://localhost:8443/"
          proxy: "http://localhost:3333"
        })

  context "with an upstream proxy", ->
    beforeEach ->
      @oldEnv = Object.assign({}, process.env)
      process.env.NO_PROXY = ""
      process.env.HTTP_PROXY = process.env.HTTPS_PROXY = "http://localhost:9001"

      @upstream = new DebugProxy({
        keepRequests: true
      })

      @upstream.start(9001)

    it "passes a request to an https server through the upstream", ->
      request({
        strictSSL: false
        url: "https://localhost:8444/"
        proxy: "http://localhost:3333"
      }).then (res) =>
        expect(@upstream.getRequests()[0]).to.include({
          url: 'localhost:8444'
          https: true
        })
        expect(res).to.contain("https server")

    it "uses HTTP basic auth when provided", ->
      @upstream.setAuth({
        username: 'foo'
        password: 'bar'
      })

      process.env.HTTP_PROXY = process.env.HTTPS_PROXY = "http://foo:bar@localhost:9001"

      request({
        strictSSL: false
        url: "https://localhost:8444/"
        proxy: "http://localhost:3333"
      }).then (res) =>
        expect(@upstream.getRequests()[0]).to.include({
          url: 'localhost:8444'
          https: true
        })
        expect(res).to.contain("https server")

    it "closes outgoing connections when client disconnects", ->
      @sandbox.spy(net.Socket.prototype, 'connect')

      request({
        strictSSL: false
        url: "https://localhost:8444/replace"
        proxy: "http://localhost:3333"
        resolveWithFullResponse: true
        forever: false
      })
      .then (res) =>
        ## ensure client has disconnected
        expect(res.socket.destroyed).to.be.true

        ## ensure the outgoing socket created for this connection was destroyed
        socket = net.Socket.prototype.connect.getCalls()
        .find (call) =>
          _.isEqual(call.args[0][0], {
            host: 'localhost'
            port: 9001
          })
        .thisValue

        new Promise (resolve) ->
          socket.on 'close', =>
            expect(socket.destroyed).to.be.true
            resolve()

    afterEach ->
      @upstream.stop()
      Object.assign(process.env, @oldEnv)
