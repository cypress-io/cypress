require("../spec_helper")

browsers = require("#{root}lib/browsers")
Project = require("#{root}lib/project")
openProject = require("#{root}lib/open_project")
preprocessor = require("#{root}lib/plugins/preprocessor")

describe "lib/open_project", ->
  beforeEach ->
    @sandbox.stub(browsers, "get").resolves()
    @sandbox.stub(browsers, "open")
    @sandbox.stub(Project.prototype, "open")
    @sandbox.stub(Project.prototype, "reset").resolves()
    @sandbox.stub(Project.prototype, "ensureSpecUrl").resolves()
    @sandbox.stub(Project.prototype, "getConfig").resolves({})
    @sandbox.stub(Project.prototype, "getAutomation")
    @sandbox.stub(preprocessor, "removeFile")

    openProject.create("/project/root")

  context "#launch", ->

    it "tells preprocessor to remove file on browser close", ->
      openProject.launch("chrome", "path/to/spec").then ->
        browsers.open.lastCall.args[1].onBrowserClose()
        expect(preprocessor.removeFile).to.be.calledWith("path/to/spec")

    it "runs original onBrowserClose callback on browser close", ->
      onBrowserClose = @sandbox.stub()
      options = { onBrowserClose }
      openProject.launch("chrome", "path/to/spec", options).then ->
        browsers.open.lastCall.args[1].onBrowserClose()
        expect(onBrowserClose).to.be.called
