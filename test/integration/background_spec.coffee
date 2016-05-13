require("../spec_helper")

_          = require("lodash")
http       = require("http")
socket     = require("@cypress/core-socket")
Promise    = require("bluebird")
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
  tabs: {
    query: ->
    executeScript: ->
  }
}

tab1 = {
  "active": false,
  "audible": false,
  "favIconUrl": "http://localhost:2020/__cypress/static/img/favicon.ico",
  "height": 553,
  "highlighted": false,
  "id": 1,
  "incognito": false,
  "index": 0,
  "mutedInfo": {
    "muted": false
  },
  "pinned": false,
  "selected": false,
  "status": "complete",
  "title": "foobar",
  "url": "http://localhost:2020/__/#tests",
  "width": 1920,
  "windowId": 1
}

tab2 = {
  "active": true,
  "audible": false,
  "favIconUrl": "http://localhost:2020/__cypress/static/img/favicon.ico",
  "height": 553,
  "highlighted": true,
  "id": 2,
  "incognito": false,
  "index": 1,
  "mutedInfo": {
    "muted": false
  },
  "pinned": false,
  "selected": true,
  "status": "complete",
  "title": "foobar",
  "url": "http://localhost:2020/__/#tests",
  "width": 1920,
  "windowId": 1
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
        {name: "foo", value: "f", path: "/", domain: "localhost", secure: true, httpOnly: true, expirationDate: 123}
        {name: "bar", value: "b", path: "/", domain: "localhost", secure: false, httpOnly: false, expirationDate: 456}
      ])

      background.getAll({domain: "localhost"})
      .then (cookies) ->
        expect(cookies).to.deep.eq([
          {name: "foo", value: "f", path: "/", domain: "localhost", secure: true, httpOnly: true, expirationDate: 123}
          {name: "bar", value: "b", path: "/", domain: "localhost", secure: false, httpOnly: false, expirationDate: 456}
        ])

  context ".query", ->
    beforeEach ->
      @code = "var s; (s = document.getElementById('__cypress-string')) && s.textContent"

    it "resolves on the 1st tab", ->
      @sandbox.stub(chrome.tabs, "query")
      .withArgs({url: "http://localhost:2020/*", windowType: "normal"})
      .yieldsAsync([tab1])

      @sandbox.stub(chrome.tabs, "executeScript")
      .withArgs(tab1.id, {code: @code})
      .yieldsAsync(["1234"])

      background.query("http://localhost:2020", {
        string: "1234"
        element: "__cypress-string"
      })

    it "resolves on the 2nd tab", ->
      @sandbox.stub(chrome.tabs, "query")
      .withArgs({url: "http://localhost:2020/*", windowType: "normal"})
      .yieldsAsync([tab1, tab2])

      @sandbox.stub(chrome.tabs, "executeScript")
      .withArgs(tab1.id, {code: @code})
      .yieldsAsync(["foobarbaz"])
      .withArgs(tab2.id, {code: @code})
      .yieldsAsync(["1234"])

      background.query("http://localhost:2020", {
        string: "1234"
        element: "__cypress-string"
      })

    it "rejects if no tab matches", ->
      @sandbox.stub(chrome.tabs, "query")
      .withArgs({url: "http://localhost:2020/*", windowType: "normal"})
      .yieldsAsync([tab1, tab2])

      @sandbox.stub(chrome.tabs, "executeScript")
      .withArgs(tab1.id, {code: @code})
      .yieldsAsync(["foobarbaz"])
      .withArgs(tab2.id, {code: @code})
      .yieldsAsync(["foobarbaz2"])

      background.query("http://localhost:2020", {
        string: "1234"
        element: "__cypress-string"
      })
      .then ->
        throw new Error("should have failed")
      .catch (err) ->
        ## we good if this hits
        expect(err.length).to.eq(2)
        expect(err).to.be.instanceof(Promise.AggregateError)

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
          {name: "session", value: "key", path: "/login", domain: "google", secure: true, httpOnly: true, expirationDate: 123}
        ])
        .withArgs({domain: "google.com", name: "doesNotExist"})
        .yieldsAsync([])

      it "returns a specific cookie by name", (done) ->
        @socket.on "automation:response", (id, obj = {}) ->
          expect(id).to.eq(123)
          expect(obj.response).to.deep.eq({name: "session", value: "key", path: "/login", domain: "google", secure: true, httpOnly: true, expirationDate: 123})
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
        .withArgs({domain: "google.com", name: "session", value: "key", path: "/", secure: false, url: "http://google.com/"})
        .yieldsAsync(
          {name: "session", value: "key", path: "/", domain: "google", secure: false, httpOnly: false}
        )
        .withArgs({name: "foo", value: "bar", secure: true, domain: "localhost", path: "/foo", url: "https://localhost/foo"})
        .yieldsAsync(null)

      afterEach ->
        delete chrome.runtime.lastError

      it "resolves with the cookie details", (done) ->
        @socket.on "automation:response", (id, obj = {}) ->
          expect(id).to.eq(123)
          expect(obj.response).to.deep.eq({name: "session", value: "key", path: "/", domain: "google", secure: false, httpOnly: false})
          done()

        @server.emit("automation:request", 123, "set:cookie", {domain: "google.com", name: "session", secure: false, value: "key", path: "/"})

      it "rejects with chrome.runtime.lastError", (done) ->
        @socket.on "automation:response", (id, obj = {}) ->
          expect(id).to.eq(123)
          expect(obj.__error).to.eq("some error")
          done()

        @server.emit("automation:request", 123, "set:cookie", {name: "foo", value: "bar", domain: "localhost", secure: true, path: "/foo"})

    describe "clear:cookies", ->
      beforeEach ->
        chrome.runtime.lastError = {message: "some error"}

        @sandbox.stub(chrome.cookies, "getAll")
        .withArgs({domain: "google.com"})
        .yieldsAsync([
          {name: "session", value: "key", path: "/",    domain: "google.com", secure: true, httpOnly: true, expirationDate: 123}
          {name: "foo",     value: "bar", path: "/foo", domain: "google.com", secure: false, httpOnly: false, expirationDate: 456}
        ])
        .withArgs({domain: "cdn.github.com"})
        .yieldsAsync([
          {name: "shouldThrow", value: "key", path: "/assets", domain: "cdn.github.com", secure: false, httpOnly: true, expirationDate: 123}
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
            {name: "session", value: "key", path: "/",    domain: "google.com", secure: true, httpOnly: true, expirationDate: 123}
            {name: "foo",     value: "bar", path: "/foo", domain: "google.com", secure: false, httpOnly: false, expirationDate: 456}
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
          {name: "session", value: "key", path: "/", domain: "google.com", secure: true, httpOnly: true, expirationDate: 123}
        ])
        .withArgs({domain: "google.com", name: "doesNotExist"})
        .yieldsAsync([])
        .withArgs({domain: "cdn.github.com", name: "shouldThrow"})
        .yieldsAsync([
          {name: "shouldThrow", value: "key", path: "/assets", domain: "cdn.github.com", secure: false, httpOnly: true, expirationDate: 123}
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
            {name: "session", value: "key", path: "/", domain: "google.com", secure: true, httpOnly: true, expirationDate: 123}
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

    describe "is:automation:connected", ->
      beforeEach ->
        @sandbox.stub(chrome.tabs, "query")
        .withArgs({url: "CHANGE_ME_HOST/*", windowType: "normal"})
        .yieldsAsync([])

      it "queries url and resolve", (done) ->
        @socket.on "automation:response", (id, obj = {}) ->
          expect(id).to.eq(123)
          expect(obj.response).to.be.undefined
          done()

        @server.emit("automation:request", 123, "is:automation:connected")


