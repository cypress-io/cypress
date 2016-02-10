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

ci       = require("#{root}../lib/electron/handlers/ci")
project  = require("#{root}../lib/electron/handlers/project")
headless = require("#{root}../lib/electron/handlers/headless")

describe.only "electron/ci", ->
  after ->
    mockery.disable()

  context ".run", ->
    beforeEach ->
      @sandbox.stub(ci, "ensureCi").resolves()
      @sandbox.stub(ci, "ensureProjectAPIToken").resolves("guid-abc")
      @sandbox.stub(project, "add").resolves()
      @sandbox.stub(project, "id").resolves("id-123")
      @sandbox.stub(headless, "run").resolves()

    it "ensures ci", ->
      ci.run({}).then ->
        expect(ci.ensureCi).to.be.calledOnce

    it "adds project with projectPath", ->
      ci.run({projectPath: "path/to/project"}).then ->
        expect(project.add).to.be.calledWith("path/to/project")

    it "gets project id by path", ->
      ci.run({projectPath: "path/to/project"}).then ->
        expect(project.id).to.be.calledWith("path/to/project")

    it "passes id + projectPath + options.key to ensureProjectAPIToken", ->
      ci.run({projectPath: "path/to/project", key: "key-foo"}).then ->
        expect(ci.ensureProjectAPIToken).to.be.calledWith("id-123", "path/to/project", "key-foo")

    it "calls headless.run + passes ci_guid into options", ->
      opts = {foo: "bar"}
      ci.run(opts).then ->
        expect(headless.run).to.be.calledWith({foo: "bar", ci_guid: "guid-abc"})