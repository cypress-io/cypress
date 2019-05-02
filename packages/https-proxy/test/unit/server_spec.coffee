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

      @setup({onError: onError})
      .then (srv) ->
        conn = srv._makeDirectConnection({url: "localhost:8444"}, socket, head)

      return

    it "with proxied connection calls options.onError with err and port and destroys the client socket", (done) ->
      socket = new EE()
      socket.destroy = @sandbox.stub()
      head = {}

      onError = (err, socket, head, port) ->
        expect(err.message).to.eq("An error occurred while sending the request to upstream proxy: \"connect ECONNREFUSED 127.0.0.1:8444\"")

        expect(socket).to.eq(socket)
        expect(head).to.eq(head)
        expect(port).to.eq("11111")

        expect(socket.destroy).to.be.calledOnce

        done()

      @setup({onError: onError})
      .then (srv) ->
        conn = srv._makeUpstreamProxyConnection('http://127.0.0.1:8444', socket, head, '11111', 'should-not-reach.invalid')

      return

