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

  context ".getAll", ->
    it "resolves with specific cookie properties", ->
      @sandbox.stub(chrome.cookies, "getAll")
      .withArgs({domain: "localhost"})
      .yieldsAsync([
        {name: "foo", value: "f", path: "/", domain: "localhost", secure: true, httpOnly: true, expiry: 123, a: "a", b: "c"}
        {name: "bar", value: "b", path: "/", domain: "localhost", secure: false, httpOnly: false, expiry: 456, c: "a", d: "c"}
      ])

      background.getAll({domain: "localhost"})
      .then (cookies) ->
        expect(cookies).to.deep.eq([
          {name: "foo", value: "f", path: "/", domain: "localhost", secure: true, httpOnly: true, expiry: 123}
          {name: "bar", value: "b", path: "/", domain: "localhost", secure: false, httpOnly: false, expiry: 456}
        ])

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

  context "get:cookie", ->
    beforeEach (done) ->
      @sandbox.stub(chrome.cookies, "getAll")
      .withArgs({domain: "google.com", name: "session"})
      .yieldsAsync([
        {name: "session", value: "key", path: "/login", domain: "google", secure: true, httpOnly: true, expiry: 123}
      ])
      .withArgs({domain: "google.com", name: "doesNotExist"})
      .yieldsAsync([])

      @server.on "connection", (@socket) => done()

      @client = background.connect("http://localhost:#{PORT}", "/__socket.io")

    it "returns a specific cookie by name", (done) ->
      @socket.on "automation:response", (id, obj = {}) ->
        expect(id).to.eq(123)
        expect(obj.response).to.deep.eq({name: "session", value: "key", path: "/login", domain: "google", secure: true, httpOnly: true, expiry: 123})
        done()

      @server.emit("automation:request", 123, "get:cookie", {domain: "google.com", name: "session"})

    it "returns null when no cookie by name is found", (done) ->
      @socket.on "automation:response", (id, obj = {}) ->
        expect(id).to.eq(123)
        expect(obj.response).to.be.null
        done()

      @server.emit("automation:request", 123, "get:cookie", {domain: "google.com", name: "doesNotExist"})

  context "clear:cookies", ->

  context "fail", ->
