require("../spec_helper")

_             = require("lodash")
fs            = require("fs-extra")
str           = require("underscore.string")
path          = require("path")
Promise       = require("bluebird")
through       = require("through")
through2      = require("through2")
spec = require("#{root}lib/controllers/spec")
browserify    = require("browserify")
babelify      = require("babelify")
cjsxify       = require("cjsxify")
streamToPromise = require("stream-to-promise")
appData = require("#{root}lib/util/app_data")
bundle = require("#{root}lib/util/bundle")
errors = require("#{root}lib/errors")

fs = Promise.promisifyAll(fs)

fixturesRoot  = path.resolve(__dirname, "../../", "fixtures/", "server/")

collectResponse = (resStream) ->
  new Promise (resolve, reject) ->
    results = ""
    resStream
    .pipe through (d) => results += d.toString()
    .on 'error', reject
    .on 'end', -> resolve(results)

browserifyFile = (filePath) ->
  streamToPromise(
    browserify({
      entries: [filePath],
      extensions: [".js", ".jsx", ".coffee", ".cjsx"]
    })
    .transform(cjsxify)
    .transform(babelify, {
      plugins: ["add-module-exports"],
      presets: ["latest", "react"],
    })
    .bundle()
  )

describe "lib/controllers/spec", ->
  specName = "sample.js"
  specSource = ";"

  beforeEach ->
    @config = {
      projectName: "foo?bar"
      projectRoot: "/foobar"
      integrationFolder: fixturesRoot
      browserify: {
        basedir: fixturesRoot
      }
    }

    @project = {
      emit: @sandbox.stub()
    }

    @res = through2.obj (chunk, enc, cb) -> cb(null, chunk)

    @res.set  = @sandbox.stub()
    @res.type = @sandbox.stub()
    @res.send = @sandbox.spy()

    @watchers = {
      watchBundle: -> Promise.resolve()
    }

    samplePath = bundle.outputPath(@config.projectRoot, specName)
    fs.ensureDirSync(path.dirname(samplePath))
    fs.writeFileSync(samplePath, ';')

    @handle = (filePath) =>
      spec.handle filePath, {}, @res, @config, (=>), @watchers, @project

  it "sets the correct content type", ->
    @handle(specName)

    expect(@res.type)
      .to.have.been.calledOnce
      .and.to.have.been.calledWith('js')

  describe "headed mode", ->

    it "sends the file from the bundles path", ->
      @handle(specName)

      collectResponse(@res).then (result) ->
        expect(result).to.equal(specSource)

    it "sends the client-side error if there is one", ->
      @watchers.watchBundle = -> Promise.reject(new Error("Reason request failed"))

      @handle(specName).then =>
        expect(@res.send).to.have.been.called
        expect(@res.send.firstCall.args[0]).to.include("(function")
        expect(@res.send.firstCall.args[0]).to.include("Reason request failed")

  describe "headless mode", ->
    beforeEach ->
      @build = @sandbox.stub(bundle, "build").returns({
        getLatestBundle: -> Promise.resolve()
      })
      @config.isTextTerminal = true

    it "sends the file from the bundles path", ->
      @handle(specName)

      collectResponse(@res).then (result) ->
        expect(result).to.equal(specSource)

    it "logs the error and exits if there is one", ->
      err = new Error("Reason request failed")

      @build.returns({
        getLatestBundle: -> Promise.reject(err)
      })
      @log = @sandbox.stub(errors, "log")

      @handle(specName).then =>
        expect(@log).to.have.been.called
        expect(@log.firstCall.args[0].stack).to.include("Oops...we found an error preparing this test file")
        expect(@project.emit).to.have.been.calledWithMatch("exitEarlyWithErr", "Oops...we found an error preparing this test file")
        expect(@project.emit).to.have.been.calledWithMatch("exitEarlyWithErr", err.message)
