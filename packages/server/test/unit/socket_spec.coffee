require("../spec_helper")

_            = require("lodash")
os           = require("os")
path         = require("path")
uuid         = require("node-uuid")
Promise      = require("bluebird")
socketIo     = require("@packages/socket")
extension    = require("@packages/extension")
httpsAgent   = require("https-proxy-agent")
errors       = require("#{root}lib/errors")
config       = require("#{root}lib/config")
Socket       = require("#{root}lib/socket")
Server       = require("#{root}lib/server")
Automation   = require("#{root}lib/automation")
exec         = require("#{root}lib/exec")
savedState   = require("#{root}lib/saved_state")
preprocessor = require("#{root}lib/plugins/preprocessor")
fs           = require("#{root}lib/util/fs")
open         = require("#{root}lib/util/open")
Fixtures     = require("#{root}/test/support/helpers/fixtures")

describe "lib/socket", ->
  beforeEach ->
    Fixtures.scaffold()

    @todosPath = Fixtures.projectPath("todos")
    @server    = Server(@todosPath)

    config.get(@todosPath)
    .then (@cfg) =>

  afterEach ->
    Fixtures.remove()
    @server.close()

  context "integration", ->
    beforeEach (done) ->
      ## create a for realz socket.io connection
      ## so we can test server emit / client emit events
      @server.open(@cfg)
      .then =>
        @options = {
          onSavedStateChanged: sinon.spy()
        }

        @automation = Automation.create(@cfg.namespace, @cfg.socketIoCookie, @cfg.screenshotsFolder)

        @server.startWebsockets(@automation, @cfg, @options)
        @socket = @server._socket

        done = _.once(done)

        ## when our real client connects then we're done
        @socket.io.on "connection", (socket) =>
          @socketClient = socket
          done()

        {proxyUrl, socketIoRoute} = @cfg

        ## force node into legit proxy mode like a browser
        agent = new httpsAgent("http://localhost:#{@cfg.port}")

        @client = socketIo.client(proxyUrl, {
          agent: agent
          path: socketIoRoute
          transports: ["websocket"]
        })
      return

    afterEach ->
      @client.disconnect()

    context "on(automation:request)", ->
      describe "#onAutomation", ->
        before ->
          global.chrome = {
            cookies: {
              set: ->
              getAll: ->
              remove: ->
              onChanged: {
                addListener: ->
              }
            }
            runtime: {

            }
            tabs: {
              query: ->
              executeScript: ->
            }
          }

        beforeEach (done) ->
          @socket.io.on "connection", (@extClient) =>
            @extClient.on "automation:client:connected", ->
              done()

          extension.connect(@cfg.proxyUrl, @cfg.socketIoRoute, socketIo.client)

        afterEach ->
          @extClient.disconnect()

        after ->
          delete global.chrome

        it "does not return cypress namespace or socket io cookies", (done) ->
          sinon.stub(chrome.cookies, "getAll")
          .withArgs({domain: "localhost"})
          .yieldsAsync([
            {name: "foo", value: "f", path: "/", domain: "localhost", secure: true, httpOnly: true, expirationDate: 123, a: "a", b: "c"}
            {name: "bar", value: "b", path: "/", domain: "localhost", secure: false, httpOnly: false, expirationDate: 456, c: "a", d: "c"}
            {name: "__cypress.foo", value: "b", path: "/", domain: "localhost", secure: false, httpOnly: false, expirationDate: 456, c: "a", d: "c"}
            {name: "__cypress.bar", value: "b", path: "/", domain: "localhost", secure: false, httpOnly: false, expirationDate: 456, c: "a", d: "c"}
            {name: "__socket.io", value: "b", path: "/", domain: "localhost", secure: false, httpOnly: false, expirationDate: 456, c: "a", d: "c"}
          ])

          @client.emit "automation:request", "get:cookies", {domain: "localhost"}, (resp) ->
            expect(resp).to.deep.eq({
              response: [
                {name: "foo", value: "f", path: "/", domain: "localhost", secure: true, httpOnly: true, expiry: 123}
                {name: "bar", value: "b", path: "/", domain: "localhost", secure: false, httpOnly: false, expiry: 456}
              ]
            })
            done()

        it "does not clear any namespaced cookies", (done) ->
          sinon.stub(chrome.cookies, "getAll")
          .withArgs({name: "session"})
          .yieldsAsync([
            {name: "session", value: "key", path: "/", domain: "google.com", secure: true, httpOnly: true, expirationDate: 123, a: "a", b: "c"}
          ])

          sinon.stub(chrome.cookies, "remove")
          .withArgs({name: "session", url: "https://google.com/"})
          .yieldsAsync(
            {name: "session", url: "https://google.com/", storeId: "123"}
          )

          cookies = [
            {name: "session", value: "key", path: "/", domain: "google.com", secure: true, httpOnly: true, expiry: 123}
            {domain: "localhost", name: "__cypress.initial", value: true}
            {domain: "localhost", name: "__socket.io", value: "123abc"}
          ]

          @client.emit "automation:request", "clear:cookies", cookies, (resp) ->
            expect(resp).to.deep.eq({
              response: [
                {name: "session", value: "key", path: "/", domain: "google.com", secure: true, httpOnly: true, expiry: 123}
              ]
            })
            done()

        it "throws trying to clear namespaced cookie"

        it "throws trying to set a namespaced cookie"

        it "throws trying to get a namespaced cookie"

        it "throws when automation:response has an error in it"

        it "throws when no clients connected to automation", (done) ->
          @extClient.disconnect()

          @client.emit "automation:request", "get:cookies", {domain: "foo"}, (resp) ->
            expect(resp.error.message).to.eq("Could not process 'get:cookies'. No automation clients connected.")
            done()

        it "returns true when tab matches magic string", (done) ->
          code = "var s; (s = document.getElementById('__cypress-string')) && s.textContent"

          sinon.stub(chrome.tabs, "query")
          .withArgs({windowType: "normal"})
          .yieldsAsync([{id: 1, url: "http://localhost"}])

          sinon.stub(chrome.tabs, "executeScript")
          .withArgs(1, {code: code})
          .yieldsAsync(["string"])

          @client.emit "is:automation:client:connected", {element: "__cypress-string", string: "string"}, (resp) ->
            expect(resp).to.be.true
            done()

        it "returns true after retrying", (done) ->
          sinon.stub(extension.app, "query").resolves(true)

          ## just force isSocketConnected to return false until the 4th retry
          iSC = sinon.stub(@socket, "isSocketConnected")

          iSC
          .onCall(0).returns(false)
          .onCall(1).returns(false)
          .onCall(2).returns(false)
          .onCall(3).returns(true)

          # oA.resolves(true)

          @client.emit "is:automation:client:connected", {element: "__cypress-string", string: "string"}, (resp) ->
            expect(iSC.callCount).to.eq(4)
            # expect(oA.callCount).to.eq(1)

            expect(resp).to.be.true
            done()

        it "returns false when times out", (done) ->
          code = "var s; (s = document.getElementById('__cypress-string')) && s.textContent"

          sinon.stub(chrome.tabs, "query")
          .withArgs({url: "CHANGE_ME_HOST/*", windowType: "normal"})
          .yieldsAsync([{id: 1}])

          sinon.stub(chrome.tabs, "executeScript")
          .withArgs(1, {code: code})
          .yieldsAsync(["foobarbaz"])

          ## reduce the timeout so we dont have to wait so long
          @client.emit "is:automation:client:connected", {element: "__cypress-string", string: "string", timeout: 100}, (resp) ->
            expect(resp).to.be.false
            done()

        it "retries multiple times and stops after timing out", (done) ->
          ## just force isSocketConnected to return false until the 4th retry
          iSC = sinon.stub(@socket, "isSocketConnected")

          ## reduce the timeout so we dont have to wait so long
          @client.emit "is:automation:client:connected", {element: "__cypress-string", string: "string", timeout: 100}, (resp) ->
            callCount = iSC.callCount

            ## it retries every 25ms so explect that
            ## this function was called at least 2 times
            expect(callCount).to.be.gt(2)

            expect(resp).to.be.false

            _.delay ->
              ## wait another 100ms and make sure
              ## that it was cancelled and not continuously
              ## retried!
              ## if we remove Promise.config({cancellation: true})
              ## then this will fail. bluebird has changed its
              ## cancellation logic before and so we want to use
              ## an integration test to ensure this works as expected
              expect(callCount).to.eq(iSC.callCount)
              done()
            , 100

      describe "options.onAutomationRequest", ->
        beforeEach ->
          @ar = sinon.stub(@automation, "request")

        it "calls onAutomationRequest with message and data", (done) ->
          @ar.withArgs("focus", {foo: "bar"}).resolves([])

          @client.emit "automation:request", "focus", {foo: "bar"}, (resp) ->
            expect(resp).to.deep.eq({response: []})
            done()

        it "calls callback with error on rejection", ->
          err = new Error("foo")

          @ar.withArgs("focus", {foo: "bar"}).rejects(err)

          @client.emit "automation:request", "focus", {foo: "bar"}, (resp) ->
            expect(resp).to.deep.eq({__error: err.message, __name: err.name, __stack: err.stack})
            done()

        it "does not return __cypress or __socket.io namespaced cookies", ->

        it "throws when onAutomationRequest rejects"

        it "is:automation:client:connected returns true", (done) ->
          @ar.withArgs("is:automation:client:connected", {string: "foo"}).resolves(true)

          @client.emit "is:automation:client:connected", {string: "foo"}, (resp) ->
            expect(resp).to.be.true
            done()

    context "on(automation:push:request)", ->
      beforeEach (done) ->
        @socketClient.on "automation:client:connected", -> done()

        @client.emit("automation:client:connected")

      it "emits 'automation:push:message'", (done) ->
        data = {cause: "explicit", cookie: {name: "foo", value: "bar"}, removed: true}

        emit = sinon.stub(@socket.io, "emit")

        @client.emit "automation:push:request", "change:cookie", data, ->
          expect(emit).to.be.calledWith("automation:push:message", "change:cookie", {
            cookie: {name: "foo", value: "bar"}
            message: "Cookie Removed: 'foo'"
            removed: true
          })
          done()

    context "on(open:finder)", ->
      beforeEach ->
        sinon.stub(open, "opn").resolves()

      it "calls opn with path", (done) ->
        @client.emit "open:finder", @cfg.parentTestsFolder, =>
          expect(open.opn).to.be.calledWith(@cfg.parentTestsFolder)
          done()

    context "on(watch:test:file)", ->
      it "calls socket#watchTestFileByPath with config, filePath", (done) ->
        sinon.stub(@socket, "watchTestFileByPath")

        @client.emit "watch:test:file", "path/to/file", =>
          expect(@socket.watchTestFileByPath).to.be.calledWith(@cfg, "path/to/file")
          done()

    context "on(app:connect)", ->
      it "calls options.onConnect with socketId and socket", (done) ->
        @options.onConnect = (socketId, socket) ->
          expect(socketId).to.eq("sid-123")
          expect(socket.connected).to.be.true
          done()

        @client.emit "app:connect", "sid-123"

    context "on(get:fixture)", ->
      it "returns the fixture object", (done) ->
        cb = (resp) ->
          expect(resp.response).to.deep.eq([
            { "json": true }
          ])
          done()

        @client.emit("backend:request", "get:fixture", "foo", cb)

      it "errors when fixtures fails", (done) ->
        cb = (resp) ->
          expect(resp.error.message).to.include "No fixture exists at:"
          done()

        @client.emit("backend:request", "get:fixture", "does-not-exist.txt", {}, cb)

    context "on(http:request)", ->
      it "calls socket#onRequest", (done) ->
        sinon.stub(@options, "onRequest").resolves({foo: "bar"})

        @client.emit "backend:request", "http:request", "foo", (resp) ->
          expect(resp.response).to.deep.eq({foo: "bar"})

          done()

      it "catches errors and clones them", (done) ->
        err = new Error("foo bar baz")

        sinon.stub(@options, "onRequest").rejects(err)

        @client.emit "backend:request", "http:request", "foo", (resp) ->
          expect(resp.error).to.deep.eq(errors.clone(err))

          done()

    context "on(exec)", ->
      it "calls exec#run with project root and options", (done) ->
        run = sinon.stub(exec, "run").returns(Promise.resolve("Desktop Music Pictures"))

        @client.emit "backend:request", "exec", { cmd: "ls" }, (resp) =>
          expect(run).to.be.calledWith(@cfg.projectRoot, { cmd: "ls" })
          expect(resp.response).to.eq("Desktop Music Pictures")
          done()

      it "errors when execution fails, passing through timedOut", (done) ->
        error = new Error("command not found: lsd")
        error.timedOut = true
        sinon.stub(exec, "run").rejects(error)

        @client.emit "backend:request", "exec", { cmd: "lsd" }, (resp) =>
          expect(resp.error.message).to.equal("command not found: lsd")
          expect(resp.error.timedOut).to.be.true
          done()

    context "on(save:app:state)", ->
      it "calls onSavedStateChanged with the state", (done) ->
        @client.emit "save:app:state", { reporterWidth: 500 }, =>
          expect(@options.onSavedStateChanged).to.be.calledWith({ reporterWidth: 500 })
          done()

  context "unit", ->
    beforeEach ->
      @mockClient = sinon.stub({
        on: ->
        emit: ->
      })

      @io = {
        of: sinon.stub().returns({on: ->})
        on: sinon.stub().withArgs("connection").yields(@mockClient)
        emit: sinon.stub()
        close: sinon.stub()
      }

      sinon.stub(Socket.prototype, "createIo").returns(@io)
      sinon.stub(preprocessor.emitter, "on")

      @server.open(@cfg)
      .then =>
        @automation = Automation.create(@cfg.namespace, @cfg.socketIoCookie, @cfg.screenshotsFolder)

        @server.startWebsockets(@automation, @cfg, {})

        @socket = @server._socket

    context "constructor", ->
      it "listens for 'file:updated' on preprocessor", ->
        @cfg.watchForFileChanges = true
        socket = Socket(@cfg)
        expect(preprocessor.emitter.on).to.be.calledWith("file:updated")

      it "does not listen for 'file:updated' if config.watchForFileChanges is false", ->
        preprocessor.emitter.on.reset()
        @cfg.watchForFileChanges = false
        socket = Socket(@cfg)
        expect(preprocessor.emitter.on).not.to.be.called

    context "#close", ->
      it "calls close on #io", ->
        @socket.close()
        expect(@socket.io.close).to.be.called

      it "does not error when io isnt defined", ->
        @socket.close()

    context "#watchTestFileByPath", ->
      beforeEach ->
        @socket.testsDir = Fixtures.project "todos/tests"
        @filePath        = @socket.testsDir + "/test1.js"

        sinon.stub(preprocessor, "getFile").resolves()

      it "returns undefined if trying to watch special path __all", ->
        result = @socket.watchTestFileByPath(@cfg, "integration/__all")
        expect(result).to.be.undefined

      it "returns undefined if #testFilePath matches arguments", ->
        @socket.testFilePath = path.join("tests", "test1.js")
        result = @socket.watchTestFileByPath(@cfg, path.join("integration", "test1.js"))
        expect(result).to.be.undefined

      it "closes existing watched test file", ->
        sinon.stub(preprocessor, "removeFile")
        @socket.testFilePath = "tests/test1.js"
        @socket.watchTestFileByPath(@cfg, "test2.js").then =>
          expect(preprocessor.removeFile).to.be.calledWithMatch("test1.js", @cfg)

      it "sets #testFilePath", ->
        @socket.watchTestFileByPath(@cfg, "integration/test1.js").then =>
          expect(@socket.testFilePath).to.eq "tests/test1.js"

      it "can normalizes leading slash", ->
        @socket.watchTestFileByPath(@cfg, "/integration/test1.js").then =>
          expect(@socket.testFilePath).to.eq "tests/test1.js"

      it "watches file by path", ->
        @socket.watchTestFileByPath(@cfg, "integration/test2.coffee")
        expect(preprocessor.getFile).to.be.calledWith("tests/test2.coffee", @cfg)

      it "triggers watched:file:changed event when preprocessor 'file:updated' is received", (done) ->
        sinon.stub(fs, "statAsync").resolves()
        @cfg.watchForFileChanges = true
        @socket.watchTestFileByPath(@cfg, "integration/test2.coffee")
        preprocessor.emitter.on.withArgs("file:updated").yield("integration/test2.coffee")
        setTimeout =>
          expect(@io.emit).to.be.calledWith("watched:file:changed")
          done()
        , 200

    context "#startListening", ->
      it "sets #testsDir", ->
        @cfg.integrationFolder = path.join(@todosPath, "does-not-exist")

        @socket.startListening(@server.getHttpServer(), @automation, @cfg, {})
        expect(@socket.testsDir).to.eq @cfg.integrationFolder

      describe "watch:test:file", ->
        it "listens for watch:test:file event", ->
          @socket.startListening(@server.getHttpServer(), @automation, @cfg, {})
          expect(@mockClient.on).to.be.calledWith("watch:test:file")

        it "passes filePath to #watchTestFileByPath", ->
          watchTestFileByPath = sinon.stub(@socket, "watchTestFileByPath")

          @mockClient.on.withArgs("watch:test:file").yields("foo/bar/baz")

          @socket.startListening(@server.getHttpServer(), @automation, @cfg, {})
          expect(watchTestFileByPath).to.be.calledWith(@cfg, "foo/bar/baz")

      describe "#onTestFileChange", ->
        beforeEach ->
          sinon.spy(fs, "statAsync")

        it "calls statAsync on .js file", ->
          @socket.onTestFileChange("foo/bar.js").catch(->).then =>
            expect(fs.statAsync).to.be.calledWith("foo/bar.js")

        it "calls statAsync on .coffee file", ->
          @socket.onTestFileChange("foo/bar.coffee").then =>
            expect(fs.statAsync).to.be.calledWith("foo/bar.coffee")

        it "does not emit if stat throws", ->
          @socket.onTestFileChange("foo/bar.js").then =>
            expect(@io.emit).not.to.be.called
