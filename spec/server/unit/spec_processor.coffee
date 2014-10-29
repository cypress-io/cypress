fs            = require('fs')
path          = require('path')
chai          = require('chai')
expect        = chai.expect
through       = require('through')
sinon         = require('sinon')
sinonChai     = require('sinon-chai');
_             = require('lodash')
SpecProcessor = require("../../../lib/controllers/spec_processor")
FixturesRoot  = path.resolve(__dirname, '../../', 'fixtures/', 'server/')

describe.only "spec processor", ->
  afterEach ->
    try
      fs.unlinkSync(path.join(FixturesRoot, '/sample.js'))
    catch

  beforeEach ->
    @specProcessor = new SpecProcessor
    @res = through (d) -> this.push(d)

    @res.type = sinon.stub()

    @opts = {
      testFolder: FixturesRoot
      spec: 'sample.js'
    }

    global.app =
      get: -> {}

    fs.writeFileSync(path.join(FixturesRoot, '/sample.js'), ';')

  it "sets the correct content type", ->
    @specProcessor.handle @opts, {}, @res, =>

    expect(@res.type).to.have.been.calledOnce
    .and.to.have.been.calledWith('js')

  it "compiles coffeescript"
  it "handles snocket includes"
  it "handles commonjs requires"
  it "handles requirejs"