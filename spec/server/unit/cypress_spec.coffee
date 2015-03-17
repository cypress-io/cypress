root           = '../../../'
child_process  = require("child_process")
expect         = require('chai').expect
sinon          = require 'sinon'
Fixtures       = require "#{root}/spec/server/helpers/fixtures"
Server         = require "#{root}lib/server"
Project        = require "#{root}lib/project"
Socket         = require "#{root}lib/socket"
Settings       = require "#{root}lib/util/settings"
Cypress        = require "#{root}/lib/cypress"

describe "Cypress", ->
  beforeEach ->
    @sandbox = sinon.sandbox.create()
    @sandbox.stub(Socket.prototype, "startListening")
    @sandbox.stub(Project.prototype, "ensureProjectId").resolves({})
    @sandbox.stub(Settings, "readSync").returns({})

  afterEach ->
    @sandbox.restore()

    delete require.cache[require.resolve("#{root}lib/cypress")]

  context "required as a module", ->
    beforeEach ->
      @open = @sandbox.spy Server.prototype, "open"

      @booter = Cypress("/Users/brian/app")

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

    it "auto opens idGeneratorUrl"

  context "required with {fork: true}", ->
    beforeEach ->
      @currentTest.timeout(10000)
      Fixtures.scaffold()

      @fork = @sandbox.spy child_process, "fork"

      @todos = Fixtures.project("todos")

      @booter = Cypress(@todos)

    afterEach (done) ->
      Fixtures.remove()

      if @booter and @booter.child
        @booter.child.on "close", -> done()

        @booter.child.kill()

      else
        done()

    it "forks booter with the proper projectRoot argument", ->
      @booter.boot({fork: true}).then (settings) =>
        expect(@fork).to.be.calledWith require.resolve("#{root}lib/cypress"), [@todos]
        expect(settings.projectRoot).to.eq @todos