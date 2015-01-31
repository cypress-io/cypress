root         = '../../../'
path         = require 'path'
IdGenerator  = require "#{root}lib/id_generator"
expect       = require('chai').expect
fs           = require 'fs-extra'
# _            = require 'lodash'
# nock         = require('nock')
Socket       = require "#{root}lib/socket"
Server       = require "#{root}lib/server"
Keys         = require "#{root}lib/keys"
Settings     = require "#{root}lib/util/settings"
sinon        = require "sinon"
sinonPromise = require 'sinon-as-promised'
# rimraf       = require('rimraf')

describe "IdGenerator", ->
  beforeEach ->
    @sandbox = sinon.sandbox.create()
    @sandbox.stub(Settings, "read").resolves({projectId: "abc-123-foo-bar"})
    @sandbox.stub(Settings, "readSync").returns({})

    # @rootPath = "fake"
    # @specData =
    #   title: "test 1"
    #   spec: "#{@rootPath}/spec.js"

    # fs.mkdirSync(@rootPath);
    # fs.writeFileSync("#{@rootPath}/spec.js", '', 'utf8');
    # fs.writeFileSync("cypress.json", '{"cypress": {}}', 'utf8');

    @server      = Server(process.cwd())
    @idGenerator = IdGenerator(@server.app)

    # nock(config.app.api_url)
    # .post("/projects")
    # .reply(200, {
    #   uuid: "6b9a82d7-3020-4f5b-a85d-14311d70b05a"
    # })

    # nock(config.app.api_url)
    # .post("/projects/6b9a82d7-3020-4f5b-a85d-14311d70b05a/keys")
    # .once()
    # .reply(200, {
    #   start: 0,
    #   end: 10
    # })

  afterEach ->
    @sandbox.restore()
    # nock.cleanAll()
    # fs.removeSync(@rootPath);
    # rimraf.sync(path.join(__dirname, root, ".cy"))

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
    it "inserts id into test"

  ## TODO: move this test out of here.
  ## its not the id generator's concern at all
  # context "generate:ids:for:test", ->
  #   beforeEach ->
  #     @projectRoot = "/Users/bmann/Dev/eclectus_examples/todomvc/backbone_marionette"

  #     @io =
  #       on: ->
  #       emit: sinon.stub()

  #     app =
  #       enabled: -> false
  #       get: =>
  #         testFolder: "tests"
  #         projectRoot: @projectRoot

  #     @socket = new Socket(@io, app)

  #   it "strips projectRoot out of filepath", ->
  #     @socket.onTestFileChange "#{@projectRoot}/tests/cypress_api.coffee"
  #     expect(@io.emit).to.be.calledWith "generate:ids:for:test", "tests/cypress_api.coffee", "cypress_api.coffee"
