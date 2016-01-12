require("../spec_helper")

path          = require("path")
through2      = require("through2")
through       = require("through")
_             = require("lodash")
_s            = require("underscore.string")
SpecProcessor = require("#{root}lib/controllers/spec_processor")
FixturesRoot  = path.resolve(__dirname, "../../", "fixtures/", "server/")

describe "Spec Processor", ->
  afterEach ->
    try
      fs.unlinkSync(path.join(FixturesRoot, '/sample.js'))

  beforeEach ->
    app =
      get: (type) ->
        projectRoot: ""
        testFolder: FixturesRoot
        browserify:
          basedir: FixturesRoot

    @specProcessor = SpecProcessor(app)
    @res = through2.obj (chunk, enc, cb) -> cb(null, chunk)

    @res.set  = @sandbox.stub()
    @res.type = @sandbox.stub()

    fs.writeFileSync(path.join(FixturesRoot, '/sample.js'), ';')

  it "returns a new instance", ->
    expect(@specProcessor).to.be.instanceOf(SpecProcessor)

  it "sets the correct content type", ->
    @specProcessor.handle "#{FixturesRoot}/sample.js", {}, @res, =>

    expect(@res.type).to.have.been.calledOnce
    .and.to.have.been.calledWith('js')

  it "handles snocket includes", (done) ->
    @specProcessor.handle "#{FixturesRoot}/snocket_root.js", {}, @res, =>
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

      @specProcessor.handle "#{FixturesRoot}/sample.coffee", {}, @res, =>

  context 'browserify', ->
    it "handles commonjs requires", (done) ->
      streamOutput = ''

      @specProcessor.handle "#{FixturesRoot}/commonjs_root.js", {}, @res, (e) => done(e)

      @res.pipe(through (d) ->
        streamOutput += d.toString()
      ).on 'close', ->
        expectedOutput = fs.readFileSync(path.join(FixturesRoot, '/commonjs_expected'), 'utf8')
        expect(_s.trim(streamOutput)).to.eql(_s.trim(expectedOutput))
        done()

  it "handles requirejs"
