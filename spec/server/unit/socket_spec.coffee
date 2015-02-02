root         = '../../../'
sinon        = require "sinon"
expect       = require('chai').expect
Socket       = require "#{root}lib/socket"
Server       = require "#{root}lib/server"
Settings     = require "#{root}lib/util/settings"

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
    describe "generate:ids:for:test", ->
      beforeEach ->
        @socket = Socket(@io, @app)

        @app.set("cypress", {
          projectRoot: "/Users/brian/app"
          testFolder: "test_specs"
        })

      it "strips projectRoot out of filepath", ->
        @socket.onTestFileChange "/Users/brian/app/test_specs/cypress_api.coffee"
        expect(@io.emit).to.be.calledWith "generate:ids:for:test", "test_specs/cypress_api.coffee", "cypress_api.coffee"
