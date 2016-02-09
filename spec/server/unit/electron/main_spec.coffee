require("../../spec_helper")

mockery.enable({
  warnOnUnregistered: false
})

mockery.registerMock("electron", electron = {
  shell: {}
  ipcMain: {}
  app: {
    commandLine: {
      appendSwitch: ->
    }
  }
})

main     = require("#{root}../lib/electron/main")
ci       = require("#{root}../lib/electron/handlers/ci")
key      = require("#{root}../lib/electron/handlers/key")
logs     = require("#{root}../lib/electron/handlers/logs")
errors   = require("#{root}../lib/electron/handlers/errors")
headed   = require("#{root}../lib/electron/handlers/headed")
headless = require("#{root}../lib/electron/handlers/headless")

describe.only "electron/main", ->
  beforeEach ->
    @on   = electron.app.on   = @sandbox.spy()
    @exit = electron.app.exit = @sandbox.spy()
    @log  = @sandbox.stub(errors, "log").resolves()

    @expectExitedWith = (code) =>
      expect(@exit).to.be.calledWith(code)

    @expectExitedWithErr = (err) ->
      expect(@log).to.be.calledWith(err)
      expect(@exit).to.be.calledWith(1)

  describe "logs", ->
    it "prints logs + exits", ->
      @sandbox.stub(logs, "get").resolves([])

      main.ready({logs: true}).then =>
        @expectExitedWith(0)

    it "catches errors", ->
      err = new Error("foo")
      @sandbox.stub(logs, "get").rejects(err)

      main.ready({logs: true}).then =>
        @expectExitedWithErr(err)

  describe "clearLogs", ->
    it "clears the logs + exits", ->
      @sandbox.stub(logs, "clear").resolves("foo")

      main.ready({clearLogs: true}).then =>
        @expectExitedWith(0)

    it "catches errors", ->
      err = new Error("foo")
      @sandbox.stub(logs, "clear").rejects(err)

      main.ready({clearLogs: true}).then =>
        @expectExitedWithErr(err)

  describe "getKey", ->
    it "prints the key + exits", ->
      @sandbox.stub(key, "print").resolves("foo")

      main.ready({getKey: true, projectPath: "foo/bar"}).then =>
        expect(key.print).to.be.calledWith("foo/bar")
        @expectExitedWith(0)

    it "catches errors", ->
      err = new Error("foo")
      @sandbox.stub(key, "print").rejects(err)

      main.ready({getKey: true, projectPath: "foo/bar"}).then =>
        @expectExitedWithErr(err)

  describe "generateKey", ->
    it "generates the key + exits", ->
      @sandbox.stub(key, "generate").resolves("foo")

      main.ready({generateKey: true, projectPath: "foo/bar"}).then =>
        expect(key.generate).to.be.calledWith("foo/bar")
        @expectExitedWith(0)

    it "catches errors", ->
      err = new Error("foo")
      @sandbox.stub(key, "generate").rejects(err)

      main.ready({generateKey: true, projectPath: "foo/bar"}).then =>
        @expectExitedWithErr(err)

  describe "ci", ->
    it "calls ci run + exits", ->
      opts = {ci: true, foo: "bar"}
      @sandbox.stub(ci, "run").resolves(10)

      main.ready(opts).then =>
        expect(ci.run).to.be.calledWith(electron.app, opts)
        @expectExitedWith(10)

    it "catches errors", ->
      err = new Error("foo")
      @sandbox.stub(ci, "run").rejects(err)

      main.ready({ci: true}).then =>
        @expectExitedWithErr(err)

  describe "headless", ->
    it "calls headless run + exits", ->
      opts = {headless: true, foo: "bar"}
      @sandbox.stub(headless, "run").resolves(10)

      main.ready(opts).then =>
        expect(headless.run).to.be.calledWith(electron.app, opts)
        @expectExitedWith(0)

    it "catches errors", ->
      err = new Error("foo")
      @sandbox.stub(headless, "run").rejects(err)

      main.ready({headless: true}).then =>
        @expectExitedWithErr(err)

  describe "headed", ->
    it "calls headed run", ->
      opts = {foo: "bar"}
      @sandbox.stub(headed, "run")

      main.ready(opts)
      expect(headed.run).to.be.calledWith(electron.app, opts)

