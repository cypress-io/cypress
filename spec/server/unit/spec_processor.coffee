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
    catch

  beforeEach ->
    @specProcessor = new SpecProcessor
    @res = through2.obj (chunk, enc, cb) -> cb(null, chunk)

    @res.type = sinon.stub()

    @opts = {
      testFolder: FixturesRoot
      spec: 'sample.js'
    }

    global.app =
      get: (type) ->
        if (type is 'config')
          return {
            projectRoot: ''
          }

        browserify:
          basedir: FixturesRoot


    fs.writeFileSync(path.join(FixturesRoot, '/sample.js'), ';')

  it "sets the correct content type", ->
    @specProcessor.handle @opts, {}, @res, =>

    expect(@res.type).to.have.been.calledOnce
    .and.to.have.been.calledWith('js')

  it "handles snocket includes", (done) ->
    @opts.spec = 'snocket_root.js'
    @specProcessor.handle @opts, {}, @res, =>

    @res.pipe through (d) ->
      expect(d.toString()).eql('console.log(\"hello\");\n//= require snocket_dep\n')
      done()

  context 'coffeescript', ->
    beforeEach ->
      fs.writeFileSync(path.join(FixturesRoot, '/sample.coffee'), '->')

    afterEach ->
      try
        fs.unlinkSync(path.join(FixturesRoot, '/sample.coffee'))
      catch

    it "compiles coffeescript", (done) ->
      @opts.spec = 'sample.coffee'

      @res.pipe(through (d) ->
        ## We have to manually catch the error here
        ## because this stream is in a domain, thus
        ## mocha will not pick up the error since we
        ## are handling it within the controller
        try
          expect(d.toString()).to.eql("(function() {\n  (function() {});\n\n}).call(this);\n")
          done()
        catch e
          this.emit('error', e)
      ).on('error', (e) -> done(e))

      @specProcessor.handle @opts, {}, @res, =>

  context 'browserify', ->
    it.only "handles commonjs requires", (done) ->
      streamOutput = ''

      @opts.spec = 'commonjs_root.js'
      @specProcessor.handle @opts, {}, @res, (e) => done(e)

      @res.pipe(through (d) ->
        streamOutput += d.toString()
      ).on 'close', ->
        expectedOutput = fs.readFileSync(path.join(FixturesRoot, '/commonjs_expected'), 'utf8')
        expect(_s.trim(streamOutput)).to.eql(_s.trim(expectedOutput))
        done()

  it "handles requirejs"
