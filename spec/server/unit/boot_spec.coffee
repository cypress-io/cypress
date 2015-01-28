root     = '../../../'
fork     = require("child_process").fork
expect   = require('chai').expect
sinon    = require 'sinon'
# Boot     = require "#{root}lib/cli"
Server   = require "#{root}lib/server"
Project  = require "#{root}lib/project"
Socket   = require "#{root}lib/socket"
Settings = require "#{root}lib/util/settings"

describe "Boot", ->
  beforeEach ->
    @sandbox = sinon.sandbox.create()
    @sandbox.stub(Socket.prototype, "startListening")
    @sandbox.stub(Project.prototype, "ensureProjectId").resolves({})
    @sandbox.stub(Settings, "readSync").returns({})

  afterEach ->
    @sandbox.restore()

  context "forked process", ->
    beforeEach (done) ->
      @boot = fork("bin/boot.js", ["/Users/brian/app"])

      @sandbox.spy(@boot, "emit")

      @boot.on "message", (msg) ->
        console.log "received message: #{JSON.stringify(msg)}"
        done() if msg.done
      # @boot.stdout.on "data", (data) -> console.log("stdout: ", data)
      # @boot.stderr.on "data", (data) -> console.log("stderr: ", data)

    afterEach (done) ->
      @boot.on "close", ->
        console.log "closed forked boot", arguments
        done()

      @boot.kill()

    it "receives projectRoot", ->
      expect(@boot.emit).to.be.calledWith "message", {projectRoot: "/Users/brian/app"}

  context.only "required as a module", ->
    beforeEach ->
      @open = @sandbox.spy Server.prototype, "open"

      require("#{root}/bin/boot")("/Users/brian/app").then (obj) =>
        {@server, @settings} = obj

    afterEach ->
      delete require.cache[require.resolve("#{root}/bin/boot")]

      @server.close()

    it "calls open", ->
      expect(@open).to.be.called

    it "passes projectRoot", ->
      expect(@settings.projectRoot).to.eq "/Users/brian/app"

    it "auto opens idGeneratorPath"