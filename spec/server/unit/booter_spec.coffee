root     = '../../../'
fork     = require("child_process").fork
expect   = require('chai').expect
sinon    = require 'sinon'
Server   = require "#{root}lib/server"
Project  = require "#{root}lib/project"
Socket   = require "#{root}lib/socket"
Settings = require "#{root}lib/util/settings"

describe "Booter", ->
  beforeEach ->
    @sandbox = sinon.sandbox.create()
    @sandbox.stub(Socket.prototype, "startListening")
    @sandbox.stub(Project.prototype, "ensureProjectId").resolves({})
    @sandbox.stub(Settings, "readSync").returns({})

  afterEach ->
    @sandbox.restore()

  context "required as a module", ->
    beforeEach ->
      @open = @sandbox.spy Server.prototype, "open"

      require("#{root}bin/booter")("/Users/brian/app").then (obj) =>
        {@server, @settings} = obj

    afterEach ->
      delete require.cache[require.resolve("#{root}bin/booter")]

      @server.close()

    it "calls open", ->
      expect(@open).to.be.called

    it "passes projectRoot", ->
      expect(@settings.projectRoot).to.eq "/Users/brian/app"

    it "auto opens idGeneratorPath"