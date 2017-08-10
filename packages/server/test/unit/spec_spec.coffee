require("../spec_helper")

_ = require("lodash")
path = require("path")
spec = require("#{root}lib/controllers/spec")
preprocessor = require("#{root}lib/preprocessor")
errors = require("#{root}lib/errors")

describe "lib/controllers/spec", ->
  specName = "sample.js"
  specSource = ";"
  outputFilePath = "foo/bar/sample.js"

  beforeEach ->
    @project = {
      emit: @sandbox.spy()
    }

    @res = {
      set: @sandbox.spy()
      type: @sandbox.spy()
      send: @sandbox.spy()
      sendFile: @sandbox.spy()
    }

    @sandbox.stub(preprocessor, "getFile").resolves(outputFilePath)

    @handle = (filePath, config = {}) =>
      spec.handle(filePath, {}, @res, config, (->), @project)

  it "sets the correct content type", ->
    @handle(specName)

    expect(@res.type)
      .to.be.calledOnce
      .and.to.be.calledWith("js")

  it "sends the file resolved from the preprocessor", ->
    @handle(specName).then =>
      expect(@res.sendFile).to.be.calledWith(outputFilePath)

  it "sends a client-side error in headed mode", ->
    preprocessor.getFile.rejects(new Error("Reason request failed"))

    @handle(specName).then =>
      expect(@res.send).to.be.called
      expect(@res.send.firstCall.args[0]).to.include("(function")
      expect(@res.send.firstCall.args[0]).to.include("Reason request failed")

  it "logs the error and exits in headless mode", ->
    @sandbox.stub(errors, "log")
    preprocessor.getFile.rejects(new Error("Reason request failed"))

    @handle(specName, {isHeadless: true}).then =>
      expect(errors.log).to.be.called
      expect(errors.log.firstCall.args[0].stack).to.include("Oops...we found an error preparing this test file")
      expect(@project.emit).to.be.calledWithMatch("exitEarlyWithErr", "Oops...we found an error preparing this test file")
      expect(@project.emit).to.be.calledWithMatch("exitEarlyWithErr", "Reason request failed")
