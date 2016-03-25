require("../spec_helper")

_            = require("lodash")
os           = require("os")
path         = require("path")
uuid         = require("node-uuid")
client       = require("socket.io-client")
Promise      = require("bluebird")
open         = require("#{root}lib/util/open")
config       = require("#{root}lib/config")
Socket       = require("#{root}lib/socket")
Server       = require("#{root}lib/server")
Watchers     = require("#{root}lib/watchers")
Fixtures     = require("#{root}/spec/server/helpers/fixtures")

describe "lib/socket", ->
  beforeEach ->
    Fixtures.scaffold()

    @todosPath = Fixtures.projectPath("todos")
    @server    = Server(@todosPath)

    config.get(@todosPath).then (@cfg) =>

  afterEach ->
    Fixtures.remove()
    @server.close()

  context "integration", ->
    beforeEach (done) ->
      ## create a for realz socket.io connection
      ## so we can test server emit / client emit events
      @server.open(@todosPath, @cfg).then =>
        @options = {}
        @watchers = {}
        @server.startWebsockets(@watchers, @cfg, @options)
        @socket = @server._socket

        ## when our real client connects then we're done
        @socket.io.on "connection", (socket) ->
          done()

        {clientUrlDisplay, socketIoRoute} = @cfg

        @client = client(clientUrlDisplay, {path: socketIoRoute})

    afterEach ->
      @client.disconnect()

    context "on(open:finder)", ->
      beforeEach ->
        @sandbox.stub(open, "opn").resolves()

      it "calls opn with path + opts on darwin", (done) ->
        @sandbox.stub(os, "platform").returns("darwin")

        @client.emit "open:finder", @cfg.parentTestsFolder, =>
          expect(open.opn).to.be.calledWith(@cfg.parentTestsFolder, {args: "-R"})
          done()

      it "calls opn with path + no opts when not on darwin", (done) ->
        @sandbox.stub(os, "platform").returns("linux")

        @client.emit "open:finder", @cfg.parentTestsFolder, =>
          expect(open.opn).to.be.calledWith(@cfg.parentTestsFolder, {})
          done()

    context "on(is:new:project)", ->
      it "calls onNewProject with config + cb", (done) ->
        @options.onIsNewProject = @sandbox.stub().resolves(true)

        @client.emit "is:new:project", (ret) =>
          expect(ret).to.be.true
          done()

    context "on(watch:test:file)", ->
      it "calls socket#watchTestFileByPath with config, filePath, watchers", (done) ->
        watchers = {}

        @sandbox.stub(@socket, "watchTestFileByPath").yieldsAsync()

        @client.emit "watch:test:file", "path/to/file", =>
          expect(@socket.watchTestFileByPath).to.be.calledWith(@cfg, "path/to/file", watchers)
          done()

    context "on(app:connect)", ->
      it "calls options.onConnect with socketId and socket", (done) ->
        @options.onConnect = (socketId, socket) ->
          expect(socketId).to.eq("sid-123")
          expect(socket.connected).to.be.true
          done()

        @client.emit "app:connect", "sid-123"

    context "on(fixture)", ->
      it "calls socket#onFixture", (done) ->
        onFixture = @sandbox.stub(@socket, "onFixture").yieldsAsync("bar")

        @client.emit "fixture", "foo", (resp) =>
          expect(resp).to.eq("bar")

          ## ensure onFixture was called with those same arguments
          ## therefore we have verified the socket binding and
          ## the call into onFixture with the proper arguments
          expect(onFixture).to.be.calledWith(@cfg, "foo")
          done()

      it "returns the fixture object", ->
        cb = @sandbox.spy()

        @socket.onFixture(@cfg, "foo", cb).then ->
          expect(cb).to.be.calledWith [
            {"json": true}
          ]

      it "errors when fixtures fails", ->
        cb = @sandbox.spy()

        @socket.onFixture(@cfg, "invalid.exe", cb).then ->
          obj = cb.getCall(0).args[0]
          expect(obj).to.have.property("__error")
          expect(obj.__error).to.eq "Invalid fixture extension: '.exe'. Acceptable file extensions are: .json, .js, .coffee, .html, .txt, .png, .jpg, .jpeg, .gif, .tif, .tiff, .zip"

    context "on(request)", ->
      it "calls socket#onRequest", (done) ->
        onRequest = @sandbox.stub(@socket, "onRequest").yieldsAsync("bar")

        @client.emit "request", "foo", (resp) ->
          expect(resp).to.eq("bar")

          ## ensure onRequest was called with those same arguments
          ## therefore we have verified the socket binding and
          ## the call into onRequest with the proper arguments
          expect(onRequest).to.be.calledWith("foo")
          done()

      it "returns the request object", ->
        nock("http://localhost:8080")
          .get("/status.json")
          .reply(200, {status: "ok"})

        cb = @sandbox.spy()

        req = {
          url: "http://localhost:8080/status.json"
        }

        @socket.onRequest(req, cb).then ->
          expect(cb).to.be.calledWithMatch {
            status: 200
            body: {status: "ok"}
          }

      it "errors when request fails", ->
        nock.enableNetConnect()

        nock("http://localhost:8080")
          .get("/status.json")
          .reply(200, {status: "ok"})

        cb = @sandbox.spy()

        req = {
          url: "http://localhost:1111/foo"
        }

        @socket.onRequest(req, cb).then ->
          obj = cb.getCall(0).args[0]
          expect(obj).to.have.property("__error", "Error: connect ECONNREFUSED 127.0.0.1:1111")

  context "unit", ->
    beforeEach ->
      @mockClient = @sandbox.stub({
        on: ->
        emit: ->
      })

      @io = {
        of: @sandbox.stub().returns({on: ->})
        on: @sandbox.stub().withArgs("connection").yields(@mockClient)
        emit: @sandbox.stub()
        close: @sandbox.stub()
      }

      @sandbox.stub(Socket.prototype, "createIo").returns(@io)

      @server.startWebsockets({}, @cfg, {})
      @socket = @server._socket

    context "#close", ->
      beforeEach ->
        @server.startWebsockets({}, @cfg, {})
        @socket = @server._socket

      it "calls close on #io", ->
        @socket.close()
        expect(@socket.io.close).to.be.called

      it "does not error when io isnt defined", ->
        @socket.close()

    context "#watchTestFileByPath", ->
      beforeEach ->
        @socket.testsDir = Fixtures.project "todos/tests"
        @filePath        = @socket.testsDir + "/test1.js"
        @watchers        = Watchers()

      afterEach ->
        @watchers.close()

      it "returns undefined if #testFilePath matches arguments", ->
        @socket.testFilePath = @filePath
        cb = @sandbox.spy()
        @socket.watchTestFileByPath(@cfg, "test1.js", @watchers, cb)
        expect(cb).to.be.calledOnce

      it "closes existing watchedTestFile", ->
        remove = @sandbox.stub(@watchers, "remove")
        @socket.watchedTestFile = "test1.js"
        @socket.watchTestFileByPath(@cfg, "test1.js", @watchers).then ->
          expect(remove).to.be.calledWithMatch("test1.js")

      it "sets #testFilePath", ->
        @socket.watchTestFileByPath(@cfg, "test1.js", @watchers).then =>
          expect(@socket.testFilePath).to.eq @filePath

      it "can normalizes leading slash", ->
        @socket.watchTestFileByPath(@cfg, "/test1.js", @watchers).then =>
          expect(@socket.testFilePath).to.eq @filePath

      it "watches file by path", (done) ->
        socket = @socket

        ## chokidar may take 100ms to pick up the file changes
        ## so we just override onTestFileChange and whenever
        ## its invoked we finish the test
        onTestFileChange = @sandbox.stub @socket, "onTestFileChange", ->
          expect(@).to.eq(socket)
          done()

        ## not delaying this here causes random failures when running
        ## all the tests. there prob some race condition or we arent
        ## waiting for a promise or something to resolve
        Promise.delay(200).then =>
          @socket.watchTestFileByPath(@cfg, "test2.coffee", @watchers).bind(@).then ->
            fs.writeFileAsync(@socket.testsDir + "/test2.coffee", "foooooooooo")

    context "#startListening", ->
      it "sets #testsDir", ->
        @cfg.integrationFolder = path.join(@todosPath, "does-not-exist")

        @socket.startListening(@server.getHttpServer(), {}, @cfg, {})
        expect(@socket.testsDir).to.eq @cfg.integrationFolder

      describe "watch:test:file", ->
        it "listens for watch:test:file event", ->
          @socket.startListening(@server.getHttpServer(), {}, @cfg, {})
          expect(@mockClient.on).to.be.calledWith("watch:test:file")

        it "passes filePath to #watchTestFileByPath", ->
          watchers = {}
          watchTestFileByPath = @sandbox.stub(@socket, "watchTestFileByPath")

          @mockClient.on.withArgs("watch:test:file").yields("foo/bar/baz")

          @socket.startListening(@server.getHttpServer(), watchers, @cfg, {})
          expect(watchTestFileByPath).to.be.calledWith @cfg, "foo/bar/baz", watchers

      describe "#onTestFileChange", ->
        beforeEach ->
          @sandbox.spy(fs, "statAsync")

        it "does not emit if not a js or coffee files", ->
          @socket.onTestFileChange(@cfg.integrationFolder, "foo/bar")
          expect(fs.statAsync).not.to.be.called

        it "does not emit if a tmp file", ->
          @socket.onTestFileChange(@cfg.integrationFolder, "foo/subl-123.js.tmp")
          expect(fs.statAsync).not.to.be.called

        it "calls statAsync on .js file", ->
          @socket.onTestFileChange(@cfg.integrationFolder, "foo/bar.js").catch(->).then =>
            expect(fs.statAsync).to.be.calledWith("foo/bar.js")

        it "calls statAsync on .coffee file", ->
          @socket.onTestFileChange(@cfg.integrationFolder, "foo/bar.coffee").then =>
            expect(fs.statAsync).to.be.calledWith("foo/bar.coffee")

        it "does not emit if stat throws", ->
          @socket.onTestFileChange(@cfg.integrationFolder, "foo/bar.js").then =>
            expect(@io.emit).not.to.be.called

        it "emits 'generate:ids:for:test'", ->
          p = Fixtures.project("todos") + "/tests/test1.js"
          @socket.onTestFileChange(@cfg.integrationFolder, p).then =>
            expect(@io.emit).to.be.calledWith("test:changed", {file: "test1.js"})
