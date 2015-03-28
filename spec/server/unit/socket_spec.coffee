root         = '../../../'
sinon        = require "sinon"
chokidar     = require "chokidar"
expect       = require('chai').expect
fs           = require "fs-extra"
Socket       = require "#{root}lib/socket"
Server       = require "#{root}lib/server"
Settings     = require "#{root}lib/util/settings"
Fixtures     = require "#{root}/spec/server/helpers/fixtures"

describe "Socket", ->
  beforeEach ->
    @sandbox = sinon.sandbox.create()

    @io =
      on: @sandbox.stub()
      emit: @sandbox.stub()
      close: @sandbox.stub()

    @server = Server(process.cwd())
    @app    = @server.app

  afterEach ->
    @sandbox.restore()

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

    it "calls close on the watchedFiles", ->
      @socket.startListening().then (watchedFiles) =>
        close = @sandbox.spy watchedFiles, "close"

        @socket.close(watchedFiles)

        expect(close).to.be.called

  context "#startListening", ->
    beforeEach ->
      @socket = Socket(@io, @app)
      Fixtures.scaffold()

    afterEach ->
      Fixtures.remove()

    it "creates testFolder if does not exist", ->
      @server.setCypressJson {
        projectRoot: Fixtures.project("todos")
        testFolder: "does-not-exist"
      }

      @socket.startListening().then ->
        dir = fs.statSync(Fixtures.project("todos") + "/does-not-exist")
        expect(dir.isDirectory()).to.be.true

    it "listens for app close event once", ->
      close = @sandbox.spy @socket, "close"

      @socket.startListening().then (watchedFiles) ->
        @app.emit("close")
        @app.emit("close")

        expect(close).to.be.calledOnce
        expect(close).to.be.calledWith(watchedFiles)

    it "returns watched files chokidar instance", ->
      @socket.startListening().then (watchedFiles) ->
        expect(watchedFiles).to.be.instanceof chokidar.FSWatcher

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