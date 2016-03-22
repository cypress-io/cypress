require("../spec_helper")

_             = require("lodash")
fs            = require("fs-extra")
str           = require("underscore.string")
path          = require("path")
through       = require("through")
through2      = require("through2")
specProcessor = require("#{root}lib/controllers/spec_processor")
fixturesRoot  = path.resolve(__dirname, "../../", "fixtures/", "server/")

fs = Promise.promisifyAll(fs)

describe "lib/controllers/spec_processor", ->
  afterEach ->
    fs.removeAsync(path.join(fixturesRoot, '/sample.js'))
    .catch ->

  beforeEach ->
    @config = {
      projectRoot: ""
      testFolder: fixturesRoot
      browserify: {
        basedir: fixturesRoot
      }
    }

    @res = through2.obj (chunk, enc, cb) -> cb(null, chunk)

    @res.set  = @sandbox.stub()
    @res.type = @sandbox.stub()

    fs.writeFileSync(path.join(fixturesRoot, '/sample.js'), ';')

  it "sets the correct content type", ->
    specProcessor.handle "#{fixturesRoot}/sample.js", {}, @res, @config, =>

    expect(@res.type).to.have.been.calledOnce
    .and.to.have.been.calledWith('js')

  it "handles snocket includes", (done) ->
    specProcessor.handle "#{fixturesRoot}/snocket_root.js", {}, @res, @config, =>
    @results = ""

    ## We have to manually catch the error here
    ## because this stream is in a domain, thus
    ## mocha will not pick up the error since wille
    ## are handling it within the controller

    @res.pipe(through (d) =>
      @results += d.toString()
    )
    .on('end', =>
      try
        expect(@results.indexOf('console.log(\"hello\");\n//= require snocket_dep\n')).to.not.eql(-1);
        done()
      catch e
        done(e)
    )
    .on('error', done)

  context 'coffeescript', ->
    beforeEach ->
      fs.writeFileSync(path.join(fixturesRoot, '/sample.coffee'), '->')

    afterEach ->
      try
        fs.unlinkSync(path.join(fixturesRoot, '/sample.coffee'))
      catch

    it "compiles coffeescript", (done) ->
      @results = ""
      @res.pipe(through (d) => @results+=d.toString())
      .on('error', (e) -> done(e))
      .on('end', (e) =>
        ## We have to manually catch the error here
        ## because this stream is in a domain, thus
        ## mocha will not pick up the error since wille
        ## are handling it within the controller
        try
          expect(
            @results
            .indexOf("(function() {\n  (function() {});\n\n}).call(this);\n"))
          .to.not.eql(-1)
          done()
        catch e
          done(e)
      )

      specProcessor.handle "#{fixturesRoot}/sample.coffee", {}, @res, @config, =>

  context 'browserify', ->
    it "handles commonjs requires", (done) ->
      streamOutput = ''

      specProcessor.handle "#{fixturesRoot}/commonjs_root.js", {}, @res, @config, (e) => done(e)

      @res.pipe(through (d) ->
        streamOutput += d.toString()
      ).on 'close', ->
        expectedOutput = fs.readFileSync(path.join(fixturesRoot, '/commonjs_expected'), 'utf8')
        expect(str.trim(streamOutput)).to.eql(str.trim(expectedOutput))
        done()

  it "handles requirejs"
