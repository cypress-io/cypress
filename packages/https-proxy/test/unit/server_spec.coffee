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

    it "calls options.onError with err and port", (done) ->
      onError = @sandbox.stub()
      socket = new EE()
      head = {}

      @setup({onError: onError})
      .then (srv) ->
        conn = srv._makeDirectConnection({url: "localhost:8444"}, socket, head)

        conn.once "error", ->
          err = onError.getCall(0).args[0]
          expect(err.message).to.eq("connect ECONNREFUSED 127.0.0.1:8444")

          expect(onError.getCall(0).args[1]).to.eq(socket)
          expect(onError.getCall(0).args[2]).to.eq(head)
          expect(onError.getCall(0).args[3]).to.eq("8444")

          done()
      return
