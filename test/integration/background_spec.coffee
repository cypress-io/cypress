require("../spec_helper")

_          = require("lodash")
http       = require("http")
socket     = require("@cypress/core-socket")
background = require("../../app/background")

PORT = 12345

global.chrome = {
  cookies: {
    set: ->
    getAll: ->
    remove: ->
  }
  runtime: {

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

  context ".connect", ->
    it "can connect", (done) ->
      @server.on "connection", -> done()

      background.connect("http://localhost:#{PORT}", "/__socket.io")

    it "emits 'automation:connected'", (done) ->
      client = background.connect("http://localhost:#{PORT}", "/__socket.io")

      @sandbox.spy(client, "emit")

      client.on "connect", _.once ->
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

  context "integration", ->
    beforeEach (done) ->
      done = _.once(done)
      @server.on "connection", (@socket) => done()

      @client = background.connect("http://localhost:#{PORT}", "/__socket.io")

    describe "get:cookies", ->
      beforeEach ->
        @sandbox.stub(chrome.cookies, "getAll")
        .withArgs({domain: "google.com"})
        .yieldsAsync([{}, {}])

      it "returns all cookies", (done) ->
        @socket.on "automation:response", (id, obj = {}) ->
          expect(id).to.eq(123)
          expect(obj.response).to.deep.eq([{}, {}])
          done()

        @server.emit("automation:request", 123, "get:cookies", {domain: "google.com"})

    describe "get:cookie", ->
      beforeEach ->
        @sandbox.stub(chrome.cookies, "getAll")
        .withArgs({domain: "google.com", name: "session"})
        .yieldsAsync([
          {name: "session", value: "key", path: "/login", domain: "google", secure: true, httpOnly: true, expiry: 123}
        ])
        .withArgs({domain: "google.com", name: "doesNotExist"})
        .yieldsAsync([])

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

    describe "set:cookie", ->
      beforeEach ->
        chrome.runtime.lastError = {message: "some error"}

        @sandbox.stub(chrome.cookies, "set")
        .withArgs({domain: "google.com", name: "session", value: "key"})
        .yieldsAsync(
          {name: "session", value: "key", path: "/", domain: "google", secure: false, httpOnly: false, a: "a", b: "b"}
        )
        .withArgs({name: "foo", value: "bar"})
        .yieldsAsync(null)

      afterEach ->
        delete chrome.runtime.lastError

      it "resolves with the cookie details", (done) ->
        @socket.on "automation:response", (id, obj = {}) ->
          expect(id).to.eq(123)
          expect(obj.response).to.deep.eq({name: "session", value: "key", path: "/", domain: "google", secure: false, httpOnly: false})
          done()

        @server.emit("automation:request", 123, "set:cookie", {domain: "google.com", name: "session", value: "key"})

      it "rejects with chrome.runtime.lastError", (done) ->
        @socket.on "automation:response", (id, obj = {}) ->
          expect(id).to.eq(123)
          expect(obj.__error).to.eq("some error")
          done()

        @server.emit("automation:request", 123, "set:cookie", {name: "foo", value: "bar"})

    describe "clear:cookies", ->
      beforeEach ->
        chrome.runtime.lastError = {message: "some error"}

        @sandbox.stub(chrome.cookies, "getAll")
        .withArgs({domain: "google.com"})
        .yieldsAsync([
          {name: "session", value: "key", path: "/",    domain: "google.com", secure: true, httpOnly: true, expiry: 123, a: "a", b: "c"}
          {name: "foo",     value: "bar", path: "/foo", domain: "google.com", secure: false, httpOnly: false, expiry: 456, c: "a", d: "c"}
        ])
        .withArgs({domain: "cdn.github.com"})
        .yieldsAsync([
          {name: "shouldThrow", value: "key", path: "/assets", domain: "cdn.github.com", secure: false, httpOnly: true, expiry: 123, a: "a", b: "c"}
        ])

        @sandbox.stub(chrome.cookies, "remove")
        .withArgs({name: "session", url: "https://google.com/"})
        .yieldsAsync(
          {name: "session", url: "https://google.com/", storeId: "123"}
        )
        .withArgs({name: "foo", url: "http://google.com/foo"})
        .yieldsAsync(
          {name: "foo", url: "https://google.com/foo", storeId: "123"}
        )
        .withArgs({name: "shouldThrow", url: "http://cdn.github.com/assets"})
        .yieldsAsync(null)

      afterEach ->
        delete chrome.runtime.lastError

      it "resolves with array of removed cookies", (done) ->
        @socket.on "automation:response", (id, obj = {}) ->
          expect(id).to.eq(123)
          expect(obj.response).to.deep.eq([
            {name: "session", value: "key", path: "/",    domain: "google.com", secure: true, httpOnly: true, expiry: 123}
            {name: "foo",     value: "bar", path: "/foo", domain: "google.com", secure: false, httpOnly: false, expiry: 456}
          ])
          done()

        @server.emit("automation:request", 123, "clear:cookies", {domain: "google.com"})

      it "rejects with chrome.runtime.lastError", (done) ->
        @socket.on "automation:response", (id, obj = {}) ->
          expect(id).to.eq(123)
          expect(obj.__error).to.eq("some error")
          done()

        @server.emit("automation:request", 123, "clear:cookies", {domain: "cdn.github.com"})

    describe "clear:cookie", ->
      beforeEach ->
        chrome.runtime.lastError = {message: "some error"}

        @sandbox.stub(chrome.cookies, "getAll")
        .withArgs({domain: "google.com", name: "session"})
        .yieldsAsync([
          {name: "session", value: "key", path: "/", domain: "google.com", secure: true, httpOnly: true, expiry: 123, a: "a", b: "c"}
        ])
        .withArgs({domain: "google.com", name: "doesNotExist"})
        .yieldsAsync([])
        .withArgs({domain: "cdn.github.com", name: "shouldThrow"})
        .yieldsAsync([
          {name: "shouldThrow", value: "key", path: "/assets", domain: "cdn.github.com", secure: false, httpOnly: true, expiry: 123, a: "a", b: "c"}
        ])

        @sandbox.stub(chrome.cookies, "remove")
        .withArgs({name: "session", url: "https://google.com/"})
        .yieldsAsync(
          {name: "session", url: "https://google.com/", storeId: "123"}
        )
        .withArgs({name: "shouldThrow", url: "http://cdn.github.com/assets"})
        .yieldsAsync(null)

      afterEach ->
        delete chrome.runtime.lastError

      it "resolves single removed cookie", (done) ->
        @socket.on "automation:response", (id, obj = {}) ->
          expect(id).to.eq(123)
          expect(obj.response).to.deep.eq(
            {name: "session", value: "key", path: "/", domain: "google.com", secure: true, httpOnly: true, expiry: 123}
          )
          done()

        @server.emit("automation:request", 123, "clear:cookie", {domain: "google.com", name: "session"})

      it "returns null when no cookie by name is found", (done) ->
        @socket.on "automation:response", (id, obj = {}) ->
          expect(id).to.eq(123)
          expect(obj.response).to.be.null
          done()

        @server.emit("automation:request", 123, "clear:cookie", {domain: "google.com", name: "doesNotExist"})

      it "rejects with chrome.runtime.lastError", (done) ->
        @socket.on "automation:response", (id, obj = {}) ->
          expect(id).to.eq(123)
          expect(obj.__error).to.eq("some error")
          done()

        @server.emit("automation:request", 123, "clear:cookie", {domain: "cdn.github.com", name: "shouldThrow"})
