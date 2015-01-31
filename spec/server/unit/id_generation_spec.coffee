root         = '../../../'
path         = require 'path'
expect       = require('chai').expect
sinon        = require "sinon"
sinonPromise = require 'sinon-as-promised'
Server       = require "#{root}lib/server"
Keys         = require "#{root}lib/keys"
Settings     = require "#{root}lib/util/settings"
IdGenerator  = require "#{root}lib/id_generator"
Fixtures     = require "#{root}/spec/server/helpers/fixtures"

describe "IdGenerator", ->
  beforeEach ->
    @sandbox = sinon.sandbox.create()
    @sandbox.stub(Settings, "read").resolves({projectId: "abc-123-foo-bar"})
    @sandbox.stub(Settings, "readSync").returns({})

    @server      = Server(process.cwd())
    @idGenerator = IdGenerator(@server.app)

  afterEach ->
    @sandbox.restore()

  it "stores app", ->
    expect(@idGenerator.app).to.eq @server.app

  it "stores projectRoot", ->
    expect(@idGenerator.projectRoot).to.eq process.cwd()

  it "stores keys", ->
    expect(@idGenerator.keys).to.be.instanceof Keys

  context "#nextId", ->
    beforeEach ->
      @sandbox.stub(@idGenerator, "appendTestId").resolves({})
      @sandbox.stub(@idGenerator.keys, "nextKey").resolves("00a")

    it "does not catch any errors", (done) ->
      @idGenerator.nextId({}).then ->
        done()
      .catch (err) ->
        done(err)

    it "returns the generated id", ->
      @idGenerator.nextId({}).then (id) ->
        expect(id).to.eq "00a"

  context "#getId", ->
    beforeEach ->
      @sandbox.stub(@idGenerator, "appendTestId").resolves({})
      @sandbox.stub(@idGenerator.keys.cache, "getProject").resolves({RANGE: {start: 0, end: 100}})

    it "queues multiple ids through promise semaphore", ->
        @idGenerator.getId({})
        @idGenerator.getId({})
        @idGenerator.getId({})
        @idGenerator.getId({})
        @idGenerator.getId({})
        @idGenerator.getId({})
        @idGenerator.getId({})
        @idGenerator.getId({}).then (num) ->
          expect(num).to.eql("008")

  context "#appendTestId", ->
    beforeEach ->
      @sandbox.stub(@idGenerator, "write").resolves

    it "inserts id into test"

    it "enables editFileMode"

    it "disables editFileMode after 1 second"

    it "writes back the updated content"

    it "reads original content"
      ## content should be sent to #insertId

  context "#insertId", ->
    it "inserts id into the string content", ->
      contents = Fixtures.get("ids/simple.coffee")
      newContent = @idGenerator.insertId contents, "foos", "0ab"
      expect(newContent).to.eq 'it "foos [0ab]", ->'