require("../spec_helper")

_ = require("lodash")
path = require("path")
spec = require("#{root}lib/controllers/spec")
preprocessor = require("#{root}lib/plugins/preprocessor")

describe "lib/controllers/spec", ->
  specName = "sample.js"
  specSource = ";"
  outputFilePath = "foo/bar/sample.js"

  beforeEach ->
    @project = {
      emit: sinon.spy()
    }

    @res = {
      set: sinon.spy()
      type: sinon.spy()
      send: sinon.spy()
      sendFile: sinon.stub()
    }

    sinon.stub(preprocessor, "getFile").resolves(outputFilePath)
    @onError = sinon.spy()

    @handle = (filePath, config = {}) =>
      spec.handle(filePath, {}, @res, config, (->), @onError)

  it "sets the correct content type", ->
    @handle(specName)

    expect(@res.type)
      .to.be.calledOnce
      .and.to.be.calledWith("js")

  it "sends the file resolved from the preprocessor", ->
    @res.sendFile.yields()
    @handle(specName).then =>
      expect(@res.sendFile).to.be.calledWith(outputFilePath)

  it "sends a client-side error in interactive mode", ->
    preprocessor.getFile.rejects(new Error("Reason request failed"))

    @handle(specName).then =>
      expect(@res.send).to.be.called
      expect(@res.send.firstCall.args[0]).to.include("(function")
      expect(@res.send.firstCall.args[0]).to.include("Reason request failed")

  it "calls onError callback in run mode", ->
    preprocessor.getFile.rejects(new Error("Reason request failed"))

    @handle(specName, {isTextTerminal: true}).then =>
      expect(@onError).to.be.called
      expect(@onError.lastCall.args[0].message).to.include("Oops...we found an error preparing this test file")
      expect(@onError.lastCall.args[0].message).to.include("Reason request failed")

  it "errors when sending file errors", ->
    sendFileErr = new Error("ENOENT")
    @res.sendFile.yields(sendFileErr)
    @handle(specName).then =>
      expect(@res.send.firstCall.args[0]).to.include("(function")
      expect(@res.send.firstCall.args[0]).to.include("ENOENT")
