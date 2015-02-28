root         = '../../../'
sinon        = require "sinon"
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

    @app = Server(process.cwd()).app

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

  context "#startListening", ->
    beforeEach ->
      @socket = Socket(@io, @app)
      Fixtures.scaffold()

    afterEach ->
      Fixtures.remove()

    it "creates testFolder if does not exist", ->
      @app.set "cypress", {
        projectRoot: Fixtures.project("todos")
        testFolder: "does-not-exist"
      }

      @socket.startListening().then ->
        dir = fs.statSync(Fixtures.project("todos") + "/does-not-exist")
        expect(dir.isDirectory()).to.be.true

    describe "#onTestFileChange", ->
      beforeEach ->
        @statAsync = @sandbox.spy(fs, "statAsync")

        @app.set "cypress", {
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