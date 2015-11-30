require("../spec_helper")

_            = require "lodash"
Socket       = require "#{root}lib/socket"
Server       = require "#{root}lib/server"
Watchers     = require "#{root}lib/watchers"
Settings     = require "#{root}lib/util/settings"
Fixtures     = require "#{root}/spec/server/helpers/fixtures"

describe "Socket", ->
  beforeEach ->
    @ioSocket =
      on: @sandbox.stub()
      emit: @sandbox.stub()

    @io =
      of: @sandbox.stub().returns({on: ->})
      on: @sandbox.stub().callsArgWith(1, @ioSocket)
      emit: @sandbox.stub()
      close: @sandbox.stub()

    @server = Server(process.cwd())
    @app    = @server.app

  afterEach ->
    Settings.remove(process.cwd())

  it "returns a socket instance", ->
    s = Socket(@io, @app)
    expect(s).to.be.instanceof Socket

  it "throws without io instance", ->
    fn = => Socket(null, @app)
    expect(fn).to.throw "Instantiating lib/socket requires an io instance!"

  it "throws without app", ->
    fn = => Socket(@io, null)
    expect(fn).to.throw "Instantiating lib/socket requires an app!"

  context "#close", ->
    beforeEach ->
      @socket = Socket(@io, @app)

    it "calls close on #io", ->
      @socket.close()
      expect(@io.close).to.be.called

  context "#watchTestFileByPath", ->
    beforeEach ->
      @socket          = Socket(@io, @app)
      @socket.testsDir = Fixtures.project "todos/tests"
      @filePath        = @socket.testsDir + "/test1.js"
      @watchers        = Watchers()

      Fixtures.scaffold()

    afterEach ->
      @socket.close()
      Fixtures.remove()
      @watchers.close()

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
        @socket.watchTestFileByPath("test1.js", @watchers).bind(@).then ->
          fs.writeFileAsync(@filePath, "foooooooooo")

  context "#onRequest", ->
    beforeEach ->
      Fixtures.scaffold()

      @todos   = Fixtures.project("todos")
      @server  = Server(@todos)
      @app     = @server.app
      @socket  = Socket(@io, @app)

    afterEach ->
      Fixtures.remove()

    it "binds to 'request' event", ->
      @socket.startListening().then =>
        expect(@ioSocket.on).to.be.calledWith("request")

    it "calls socket#onRequest", ->
      onRequest = @sandbox.stub(@socket, "onRequest")

      @socket.startListening().then =>
        socketCall = _.find @ioSocket.on.getCalls(), (call) ->
          call.args[0] is "request"

        ## get the callback function here
        socketFn = socketCall.args[1]
        socketFn.call(@socket, "foo", "bar")

        ## ensure onRequest was called with those same arguments
        ## therefore we have verified the socket binding and
        ## the call into onRequest with the proper arguments
        expect(onRequest).to.be.calledWith("foo", "bar")

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

  context "#onFixture", ->
    beforeEach ->
      Fixtures.scaffold()

      @todos   = Fixtures.project("todos")
      @server  = Server(@todos)
      @app     = @server.app
      @socket  = Socket(@io, @app)

    afterEach ->
      Fixtures.remove()

    it "binds to 'fixture' event", ->
      @socket.startListening().then =>
        expect(@ioSocket.on).to.be.calledWith("fixture")

    it "calls socket#onFixture", ->
      onFixture = @sandbox.stub(@socket, "onFixture")

      @socket.startListening().then =>
        socketCall = _.find @ioSocket.on.getCalls(), (call) ->
          call.args[0] is "fixture"

        ## get the callback function here
        socketFn = socketCall.args[1]
        socketFn.call(@socket, "foo", "bar")

        ## ensure onFixture was called with those same arguments
        ## therefore we have verified the socket binding and
        ## the call into onFixture with the proper arguments
        expect(onFixture).to.be.calledWith("foo", "bar")

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
      @socket = Socket(@io, @app)
      Fixtures.scaffold()

    afterEach ->
      @socket.close()
      Fixtures.remove()

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

  context "#_runSauce", ->
    beforeEach ->
      @socket = Socket(@io, @app)
      @sauce  = @sandbox.stub(@socket, "sauce").resolves()
      @sandbox.stub(Date, "now").returns(10000000)
      @sandbox.stub(@socket.uuid, "v4").returns("abc123-edfg2323")

    afterEach ->
      @socket.close()

    it "calls callback with jobName and batchId", ->
      fn = @sandbox.stub()
      @socket._runSauce @ioSocket, "app_spec.coffee", fn
      expect(fn).to.be.calledWith "tests/app_spec.coffee", 10000000

    it "emits 'sauce:job:create' with client options", ->
      fn = @sandbox.stub()
      @socket._runSauce @ioSocket, "app_spec.coffee", fn
      expect(@ioSocket.emit).to.be.calledWithMatch "sauce:job:create", {
        batchId: 10000000
        browser: "ie"
        guid: "abc123-edfg2323"
        manualUrl: "http://localhost:2020/__/#/tests/app_spec.coffee"
        os: "Windows 8.1"
        version: 11
      }

    it "passes options to sauce", ->
      fn = @sandbox.stub()
      @socket._runSauce @ioSocket, "app_spec.coffee", fn
      options = @sauce.getCall(0).args[0]
      expect(options).to.deep.eq {
        batchId: 10000000
        guid: "abc123-edfg2323"
        manualUrl: "http://localhost:2020/__/#/tests/app_spec.coffee"
        remoteUrl: "http://localhost:2020/__/#/tests/app_spec.coffee?nav=false"
        screenResolution: "1280x1024"
        browserName: options.browserName
        version:     options.version
        platform:    options.platform
        onStart:     options.onStart
      }