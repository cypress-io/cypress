root           = '../../../'
child_process  = require("child_process")
expect         = require('chai').expect
sinon          = require 'sinon'
Fixtures       = require "#{root}/spec/server/helpers/fixtures"
Server         = require "#{root}lib/server"
Project        = require "#{root}lib/project"
Socket         = require "#{root}lib/socket"
Settings       = require "#{root}lib/util/settings"
Booter             = require "#{root}/bin/booter"

describe "Booter", ->
  beforeEach ->
    @sandbox = sinon.sandbox.create()
    @sandbox.stub(Socket.prototype, "startListening")
    @sandbox.stub(Project.prototype, "ensureProjectId").resolves({})
    @sandbox.stub(Settings, "readSync").returns({})

  afterEach ->
    @sandbox.restore()

    delete require.cache[require.resolve("#{root}bin/booter")]

  context "required as a module", ->
    beforeEach ->
      @open = @sandbox.spy Server.prototype, "open"

      @booter = Booter("/Users/brian/app")

      @booter.boot().then (obj) =>
        {@server, @settings} = obj

    afterEach ->
      @server.close()

    it "calls open", ->
      expect(@open).to.be.called

    it "passes projectRoot", ->
      expect(@settings.projectRoot).to.eq "/Users/brian/app"

    it "stores projectRoot on cy", ->
      expect(@booter.projectRoot).to.eq "/Users/brian/app"

    it "auto opens idGeneratorPath"

  context "required with {fork: true}", ->
    beforeEach ->
      Fixtures.scaffold()

      @fork = @sandbox.spy child_process, "fork"

      @todos = Fixtures.project("todos")

      @booter = Booter(@todos)

    afterEach (done) ->
      Fixtures.remove()

      if @booter and @booter.child
        @booter.child.on "close", -> done()

        @booter.child.kill()

      else
        done()

    it "forks booter with the proper projectRoot argument", ->
      @booter.boot({fork: true}).then (settings) =>
        expect(@fork).to.be.calledWith require.resolve("#{root}bin/booter"), [@todos]
        expect(settings.projectRoot).to.eq @todos