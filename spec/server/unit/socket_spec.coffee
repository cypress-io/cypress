require("../spec_helper")

_            = require("lodash")
uuid         = require("node-uuid")
client       = require("socket.io-client")
Socket       = require("#{root}lib/socket")
Server       = require("#{root}lib/server")
Watchers     = require("#{root}lib/watchers")
Settings     = require("#{root}lib/util/settings")
Fixtures     = require("#{root}/spec/server/helpers/fixtures")

describe "lib/socket", ->
  beforeEach ->
    Fixtures.scaffold()

    @todosPath = Fixtures.projectPath("todos")
    @server    = Server(@todosPath)
    @app       = @server.app

  afterEach ->
    Fixtures.remove()
    @server.close()

  context.only "integration", ->
    beforeEach (done) ->
      ## create a for realz socket.io connection
      ## so we can test server emit / client emit events
      @server.open().then =>
        @server.startWebsockets({}, {})
        @socket = @server.socket

        ## when our real client connects then we're done
        @socket.io.on "connection", (socket) ->
          done()

        {clientUrlDisplay, socketIoRoute} = @server.app.get("cypress")
        @client = client(clientUrlDisplay, {path: socketIoRoute})

    afterEach ->
      @client.disconnect()

    context "on(fixture)", ->
      it "calls socket#onFixture", ->
        onFixture = @sandbox.stub(@socket, "onFixture").yieldsAsync("bar")

        @client.emit "request", "foo", (resp) ->
          expect(resp).to.eq("bar")

          ## ensure onFixture was called with those same arguments
          ## therefore we have verified the socket binding and
          ## the call into onFixture with the proper arguments
          expect(onFixture).to.be.calledWith("foo")

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

  context "unit", ->
    # @mockClient = @sandbox.stub({
    #   on: ->
    #   emit: ->
    # })

    # @mockServer = new mock.Server("http://localhost:1111")

    # @mockClient = new mock.SocketIO("http://localhost:1111")
    # @sandbox.stub(@mockServer, "on").withArgs("connection").yields(@mockClient)
    # @sandbox.stub(Socket.prototype, "createIo").returns(@mockServer)

    # @io =
    #   of: @sandbox.stub().returns({on: ->})
    #   on: @sandbox.stub().callsArgWith(1, @ioSocket)
    #   emit: @sandbox.stub()
    #   close: @sandbox.stub()

    # @socket = Socket(@app)
    # @socket.startListening(@server, {}, {})

  it "returns a socket instance", ->
    s = Socket(@app)
    expect(s).to.be.instanceof Socket

  it "throws without io instance", ->
    fn = => Socket(null, @app)
    expect(fn).to.throw "Instantiating lib/socket requires an io instance!"

  it "throws without app", ->
    fn = => Socket(@io, null)
    expect(fn).to.throw "Instantiating lib/socket requires an app!"

  context "#close", ->
    beforeEach ->
      @socket = Socket(@app)

    it "calls close on #io", ->
      @socket.startListening(@server, {}, {})
      @sandbox.spy(@socket.io, "close")
      @socket.close()
      expect(@socket.io.close).to.be.called

    it "does not error when io isnt defined", ->
      @socket.close()

  context "#watchTestFileByPath", ->
    beforeEach ->
      @socket          = Socket(@app)
      @socket.testsDir = Fixtures.project "todos/tests"
      @filePath        = @socket.testsDir + "/test1.js"
      @watchers        = Watchers()

      Fixtures.scaffold()

    afterEach ->
      @socket.close()
      @watchers.close()
      Fixtures.remove()

    it "returns undefined if #testFilePath matches arguments", ->
      @socket.testFilePath = @filePath
      expect(@socket.watchTestFileByPath("test1.js"), @watchers).to.be.undefined

    it "closes existing watchedTestFile", ->
      remove = @sandbox.stub(@watchers, "remove")
      @socket.watchedTestFile = "test1.js"
      @socket.watchTestFileByPath("test1.js", @watchers).then ->
        expect(remove).to.be.calledWithMatch("test1.js")

    it "sets #testFilePath", ->
      @socket.watchTestFileByPath("test1.js", @watchers).then =>
        expect(@socket.testFilePath).to.eq @filePath

    it "can normalizes leading slash", ->
      @socket.watchTestFileByPath("/test1.js", @watchers).then =>
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
        @socket.watchTestFileByPath("test2.coffee", @watchers).bind(@).then ->
          fs.writeFileAsync(@socket.testsDir + "/test2.coffee", "foooooooooo")

  context "#onRequest", ->
    beforeEach ->
      Fixtures.scaffold()

      @todos   = Fixtures.project("todos")
      @server  = Server(@todos)
      @app     = @server.app
      @socket  = Socket(@app)

    afterEach ->
      Fixtures.remove()

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

    it "errors when fixtures fails", ->
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

    it "returns the fixture object", ->
      cb = @sandbox.spy()

      @socket.onFixture("foo", cb).then ->
        expect(cb).to.be.calledWith [
          {"json": true}
        ]

    it "errors when fixtures fails", ->
      cb = @sandbox.spy()

      @socket.onFixture("invalid.exe", cb).then ->
        obj = cb.getCall(0).args[0]
        expect(obj).to.have.property("__error")
        expect(obj.__error).to.eq "Invalid fixture extension: '.exe'. Acceptable file extensions are: .json, .js, .coffee, .html, .txt, .png, .jpg, .jpeg, .gif, .tif, .tiff, .zip"

  context "#startListening", ->
    beforeEach ->
      @socket = Socket(@app)

    it "creates testFolder if does not exist", ->
      @server.setCypressJson {
        projectRoot: Fixtures.project("todos")
        testFolder: "does-not-exist"
      }

      @socket.startListening().then ->
        dir = fs.statSync(Fixtures.project("todos") + "/does-not-exist")
        expect(dir.isDirectory()).to.be.true

    it "sets #testsDir", ->
      @server.setCypressJson {
        projectRoot: Fixtures.project("todos")
        testFolder: "does-not-exist"
      }

      @socket.startListening().then ->
        expect(@testsDir).to.eq Fixtures.project("todos/does-not-exist")

    describe "watch:test:file", ->
      it "listens for watch:test:file event", ->
        @socket.startListening().then =>
          expect(@ioSocket.on).to.be.calledWith("watch:test:file")

      it "passes filePath to #watchTestFileByPath", ->
        watchers = {}
        watchTestFileByPath = @sandbox.stub @socket, "watchTestFileByPath"

        @ioSocket.on.withArgs("watch:test:file").callsArgWith(1, "foo/bar/baz")

        @socket.startListening(watchers).then =>
          expect(watchTestFileByPath).to.be.calledWith "foo/bar/baz", watchers

    describe "#onTestFileChange", ->
      beforeEach ->
        @statAsync = @sandbox.spy(fs, "statAsync")

        @server.setCypressJson {
          projectRoot: Fixtures.project("todos")
          testFolder: "tests"
        }

      it "does not emit if in editFileMode", ->
        @app.enable("editFileMode")

        @socket.onTestFileChange("foo/bar/baz")
        expect(@statAsync).not.to.be.called

      it "does not emit if not a js or coffee files", ->
        @socket.onTestFileChange("foo/bar")
        expect(@statAsync).not.to.be.called

      it "does not emit if a tmp file", ->
        @socket.onTestFileChange("foo/subl-123.js.tmp")
        expect(@statAsync).not.to.be.called

      it "calls statAsync on .js file", ->
        @socket.onTestFileChange("foo/bar.js").catch(->).then =>
          expect(@statAsync).to.be.calledWith("foo/bar.js")

      it "calls statAsync on .coffee file", ->
        @socket.onTestFileChange("foo/bar.coffee").then =>
          expect(@statAsync).to.be.calledWith("foo/bar.coffee")

      it "does not emit if stat throws", ->
        @socket.onTestFileChange("foo/bar.js").then =>
          expect(@io.emit).not.to.be.called

      it "emits 'generate:ids:for:test'", ->
        p = Fixtures.project("todos") + "/tests/test1.js"
        @socket.onTestFileChange(p).then =>
          expect(@io.emit).to.be.calledWith("generate:ids:for:test", "tests/test1.js", "test1.js")
