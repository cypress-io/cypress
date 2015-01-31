fs            = require('fs')
path          = require('path')
chai          = require('chai')
expect        = chai.expect
through2      = require('through2')
through       = require('through')
sinon         = require('sinon')
sinonChai     = require('sinon-chai');
_             = require('lodash')
_s            = require('underscore.string')
SpecProcessor = require("../../../lib/controllers/spec_processor")
FixturesRoot  = path.resolve(__dirname, '../../', 'fixtures/', 'server/')

describe "spec processor", ->
  afterEach ->
    try
      fs.unlinkSync(path.join(FixturesRoot, '/sample.js'))

  beforeEach ->
    @specProcessor = new SpecProcessor
    @res = through2.obj (chunk, enc, cb) -> cb(null, chunk)

    @res.type = sinon.stub()

    global.app =
      get: (type) ->
        projectRoot: ""
        testFolder: FixturesRoot
        browserify:
          basedir: FixturesRoot

    fs.writeFileSync(path.join(FixturesRoot, '/sample.js'), ';')

  it "sets the correct content type", ->
    @specProcessor.handle app, "sample.js", {}, @res, =>

    expect(@res.type).to.have.been.calledOnce
    .and.to.have.been.calledWith('js')

  it "handles snocket includes", (done) ->
    @specProcessor.handle app, 'snocket_root.js', {}, @res, =>
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
      fs.writeFileSync(path.join(FixturesRoot, '/sample.coffee'), '->')

    afterEach ->
      try
        fs.unlinkSync(path.join(FixturesRoot, '/sample.coffee'))
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

      @specProcessor.handle app, 'sample.coffee', {}, @res, =>

  context 'browserify', ->
    it "handles commonjs requires", (done) ->
      streamOutput = ''

      @specProcessor.handle app, 'commonjs_root.js', {}, @res, (e) => done(e)

      @res.pipe(through (d) ->
        streamOutput += d.toString()
      ).on 'close', ->
        expectedOutput = fs.readFileSync(path.join(FixturesRoot, '/commonjs_expected'), 'utf8')
        expect(_s.trim(streamOutput)).to.eql(_s.trim(expectedOutput))
        done()

  it "handles requirejs"
