require("../spec_helper")

http       = require("http")
socket     = require("@cypress/core-socket")
background = require("../../app/background")

PORT = 12345

global.chrome = {
  cookies: {
    getAll: ->
    remove: ->
  }
}

describe "app/background", ->
  before ->
    @io = global.io
    global.io = socket.client

  beforeEach (done) ->
    @httpSrv = http.createServer()
    @server  = socket.server(@httpSrv, {path: "/__socket.io"})
    @httpSrv.listen(PORT, done)

  afterEach (done)  ->
    @server.close()
    @httpSrv.close -> done()

  after ->
    global.io = @io

  it "can connect", (done) ->
    @server.on "connection", -> done()

    background.connect("http://localhost:#{PORT}", "/__socket.io")

  it "emits 'automation:connected'", (done) ->
    client = background.connect("http://localhost:#{PORT}", "/__socket.io")

    @sandbox.spy(client, "emit")

    client.on "connect", ->
      expect(client.emit).to.be.calledWith("automation:connected")
      done()

  context "get:cookies", ->
    beforeEach (done) ->
      @sandbox.stub(chrome.cookies, "getAll")
      .withArgs({domain: "google.com"})
      .yieldsAsync([{}, {}])

      @server.on "connection", (@socket) => done()

      @client = background.connect("http://localhost:#{PORT}", "/__socket.io")

    it "returns all cookies", (done) ->
      @socket.on "automation:response", (id, obj = {}) ->
        expect(id).to.eq(123)
        expect(obj.response).to.deep.eq([{}, {}])
        done()

      @server.emit("automation:request", 123, "get:cookies", {domain: "google.com"})

  context "clear:cookies", ->

  context "fail", ->
