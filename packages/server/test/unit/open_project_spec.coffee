require("../spec_helper")

browsers = require("#{root}lib/browsers")
Project = require("#{root}lib/project")
openProject = require("#{root}lib/open_project")
preprocessor = require("#{root}lib/plugins/preprocessor")

describe "lib/open_project", ->
  beforeEach ->
    @automation = {
      reset: sinon.stub()
      use: sinon.stub()
    }

    sinon.stub(browsers, "get").resolves()
    sinon.stub(browsers, "open")
    sinon.stub(Project.prototype, "open")
    sinon.stub(Project.prototype, "reset").resolves()
    sinon.stub(Project.prototype, "getSpecUrl").resolves()
    sinon.stub(Project.prototype, "getConfig").resolves({})
    sinon.stub(Project.prototype, "getAutomation").returns(@automation)
    sinon.stub(preprocessor, "removeFile")

    openProject.create("/project/root")

  context "#launch", ->
    beforeEach ->
      @spec = {
        absolute: "path/to/spec"
      }

      @browser = { name: "chrome" }

    it "tells preprocessor to remove file on browser close", ->
      openProject.launch(@browser, @spec)
      .then ->
        browsers.open.lastCall.args[1].onBrowserClose()
        expect(preprocessor.removeFile).to.be.calledWith("path/to/spec")

    it "does not tell preprocessor to remove file if no spec", ->
      openProject.launch(@browser, {})
      .then ->
        browsers.open.lastCall.args[1].onBrowserClose()
        expect(preprocessor.removeFile).not.to.be.called

    it "runs original onBrowserClose callback on browser close", ->
      onBrowserClose = sinon.stub()
      options = { onBrowserClose }
      openProject.launch(@browser, @spec, options)
      .then ->
        browsers.open.lastCall.args[1].onBrowserClose()
        expect(onBrowserClose).to.be.called

    it "calls project.reset on launch", ->
      openProject.launch(@browser, @spec)
      .then ->
        expect(Project.prototype.reset).to.be.called

    it "sets isHeaded + isHeadless if not already defined", ->
      expect(@browser.isHeaded).to.be.undefined
      expect(@browser.isHeadless).to.be.undefined

      openProject.launch(@browser, @spec)
      .then =>
        expect(@browser.isHeaded).to.be.true
        expect(@browser.isHeadless).to.be.false
