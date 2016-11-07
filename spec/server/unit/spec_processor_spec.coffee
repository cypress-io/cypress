require("../spec_helper")

_             = require("lodash")
fs            = require("fs-extra")
str           = require("underscore.string")
path          = require("path")
Promise       = require("bluebird")
through       = require("through")
through2      = require("through2")
specProcessor = require("#{root}lib/controllers/spec_processor")
browserify    = require("browserify")
babelify      = require("babelify")
cjsxify       = require("cjsxify")
streamToPromise = require("stream-to-promise")
fixturesRoot  = path.resolve(__dirname, "../../", "fixtures/", "server/")

fs = Promise.promisifyAll(fs)

collectResponse = (resStream, done, cb) ->
  results = ""
  resStream
  .pipe through (d) => results += d.toString()
  .on 'error', done
  .on 'end', (e) -> cb(results)

browserifyFile = (filePath) ->
  streamToPromise(
    browserify(
      entries: [filePath]
      extensions: [".js", ".jsx", ".coffee", ".cjsx"]
    )
    .transform(cjsxify)
    .transform(babelify, {
      plugins: ["add-module-exports"],
      presets: ["latest", "react"],
    })
    .bundle()
  )

describe "lib/controllers/spec_processor", ->
  beforeEach ->
    @config = {
      projectRoot: ""
      integrationFolder: fixturesRoot
      browserify: {
        basedir: fixturesRoot
      }
    }

    @res = through2.obj (chunk, enc, cb) -> cb(null, chunk)

    @res.set  = @sandbox.stub()
    @res.type = @sandbox.stub()

  it "sets the correct content type", ->
    specProcessor.handle "#{fixturesRoot}/sample.js", {}, @res, @config, =>

    expect(@res.type)
      .to.have.been.calledOnce
      .and.to.have.been.calledWith('js')

  ## We have to manually catch the errors in these
  ## because this stream is in a domain, thus
  ## mocha will not pick up the error since wille
  ## are handling it within the controller

  it "handles CoffeeScript, CJSX, and CommonJS", (done) ->
    collectResponse @res, done, (results) ->
      browserifyFile(path.join(fixturesRoot, '/coffee_sample.coffee'))
      .then (contents) =>
        try
          expect(results).to.equal(contents.toString())
          done()
        catch e
          done(e)

    specProcessor.handle "#{fixturesRoot}/coffee_sample.coffee", {}, @res, @config, (e) -> done(e)

  it "handles ES2015, JSX, and JS Modules", (done) ->
    collectResponse @res, done, (results) ->
      browserifyFile(path.join(fixturesRoot, '/es2015_root.js'))
      .then (contents) =>
        try
          expect(results).to.equal(contents.toString())
          done()
        catch e
          done(e)

    specProcessor.handle "#{fixturesRoot}/es2015_root.js", {}, @res, @config, (e) -> done(e)
