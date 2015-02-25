root          = '../../../'
Promise       = require 'bluebird'
fs            = Promise.promisifyAll(require('fs'))
expect        = require('chai').expect
sinon         = require 'sinon'
sinonPromise  = require 'sinon-as-promised'
Server        = require "#{root}lib/server"
Socket        = require "#{root}lib/socket"
Project       = require "#{root}lib/project"
Log           = require "#{root}lib/log"
Settings      = require "#{root}lib/util/settings"

describe "Server Interface", ->
  beforeEach ->
    @sandbox = sinon.sandbox.create()
    @sandbox.stub(Socket.prototype, "startListening")
    @sandbox.stub(Project.prototype, "ensureProjectId").resolves({})
    @sandbox.stub(Settings, "readSync").returns({})
    @server = Server("/Users/brian/app")

  afterEach ->
    @server?.close()

    @sandbox.restore()

  it "sets config as a property", ->
    s = Server("/foo")
    expect(s.config).to.be.an("object")

  it "throws without a project root", ->
    fn = -> Server()
    expect(fn).to.throw "Instantiating lib/server requires a projectRoot!"

  it "sets settings on Log", ->
    expect(Log.getSettings()).to.eq(@server.config)

  context "#close", ->
    it "returns a promise", ->
      expect(@server.close()).to.be.instanceof Promise

    it "calls close on @server", ->
      @server.open().bind(@).then ->
        @server.close()

    it "isListening=false", ->
      @server.open().bind(@).then ->
        @server.close().bind(@).then ->
          expect(@server.isListening).to.be.false

    it "clears settings from Log", ->
      Log.setSettings({})
      @server.close().then ->
        expect(Log.getSettings()).to.be.undefined

  context "#open", ->
    it "creates http server"

    it "creates socket io"

    it "creates global app object"

    it "stores cypress.json config and yields it", ->
      @server.open().then (config) =>
        expect(@server.app.get("cypress")).to.deep.eq config

    it "returns a promise", ->
      expect(@server.open()).to.be.instanceof Promise

    it "isListening=true", ->
      @server.open().bind(@).then ->
        expect(@server.isListening).to.be.true

  context "#getCypressJson", ->
    describe "defaults", ->
      beforeEach ->
        @defaults = (prop, value, json = {}) =>

          Settings.readSync.returns(json)

          @server = Server("/Users/brian/app")

          expect(@server.config[prop]).to.eq(value)

      it "port=3000", ->
        @defaults "port", 3000

      it "autoOpen=false", ->
        @defaults "autoOpen", false

      it "clientUrl=http://localhost:3000", ->
        @defaults "clientUrl", "http://localhost:3000"

      it "idGeneratorPath=http://localhost:3000/id_generator", ->
        @defaults "idGeneratorPath", "http://localhost:3000/id_generator"

      it "baseUrl=http://localhost:8000/app", ->
        @defaults "baseUrl", "http://localhost:8000/app", {
          baseUrl: "http://localhost:8000/app//"
        }

      it "projectRoot=/Users/brian/app", ->
        @defaults "projectRoot", "/Users/brian/app"

