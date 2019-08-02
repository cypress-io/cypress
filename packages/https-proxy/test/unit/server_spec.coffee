require("../spec_helper")

EE      = require("events")
Promise = require("bluebird")
proxy   = require("../helpers/proxy")
Server  = require("../../lib/server")

describe "lib/server", ->
  beforeEach ->
    @setup = (options = {}) =>
      @ca = {}
      @port = 12345

      Server.create(@ca, @port, options)

  afterEach ->
    delete process.env.HTTPS_PROXY
    delete process.env.NO_PROXY

  context "#listen", ->
    it "calls options.onUpgrade with req, socket head", ->
      onUpgrade = @sandbox.stub()

      @setup({onUpgrade: onUpgrade})
      .then (srv) ->
        srv._sniServer.emit("upgrade", 1, 2, 3)

        expect(onUpgrade).to.be.calledWith(1,2,3)

    it "calls options.onRequest with req, res", ->
      onRequest = @sandbox.stub()
      req = {url: "https://www.foobar.com", headers: {host: "www.foobar.com"}}
      res = {}

      @setup({onRequest: onRequest})
      .then (srv) ->
        srv._sniServer.emit("request", req, res)

        expect(onRequest).to.be.calledWith(req, res)

    it "calls options.onError with err and port and destroys the client socket", (done) ->
      socket = new EE()
      socket.destroy = @sandbox.stub()
      head = {}

      onError = (err, socket, head, port) ->
        expect(err.message).to.eq("connect ECONNREFUSED 127.0.0.1:8444")

        expect(socket).to.eq(socket)
        expect(head).to.eq(head)
        expect(port).to.eq("8444")

        expect(socket.destroy).to.be.calledOnce

        done()

      @setup({ onError })
      .then (srv) ->
        conn = srv._makeDirectConnection({url: "localhost:8444"}, socket, head)

      return

    ## https://github.com/cypress-io/cypress/issues/3250
    it "does not crash when an erroneous URL is provided, just destroys socket", (done) ->
      socket = new EE()
      socket.destroy = @sandbox.stub()
      head = {}

      onError = (err, socket, head, port) ->
        expect(err.message).to.eq("connect ECONNREFUSED 127.0.0.1:443")

        expect(socket).to.eq(socket)
        expect(head).to.eq(head)
        expect(port).to.eq("443")

        expect(socket.destroy).to.be.calledOnce

        done()

      @setup({ onError })
      .then (srv) ->
        conn = srv._makeDirectConnection({url: "%7Balgolia_application_id%7D-dsn.algolia.net:443"}, socket, head)

      return

    it "with proxied connection calls options.onError with err and port and destroys the client socket", (done) ->
      socket = new EE()
      socket.destroy = @sandbox.stub()
      head = {}

      onError = (err, socket, head, port) ->
        expect(err.message).to.eq("A connection to the upstream proxy could not be established: connect ECONNREFUSED 127.0.0.1:8444")

        expect(socket).to.eq(socket)
        expect(head).to.eq(head)
        expect(port).to.eq("11111")

        expect(socket.destroy).to.be.calledOnce

        done()

      process.env.HTTPS_PROXY = 'http://localhost:8444'
      process.env.NO_PROXY = ''

      @setup({ onError })
      .then (srv) ->
        conn = srv._makeDirectConnection({url: "should-not-reach.invalid:11111"}, socket, head)

      return

