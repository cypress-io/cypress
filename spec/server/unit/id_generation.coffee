root        = '../../../'
path        = require 'path'
idGenerator = require "#{root}lib/id_generator"
expect      = require('chai').expect
fs          = require 'fs-extra'
_           = require 'lodash'
nock        = require('nock')
Socket      = require("#{root}lib/socket")
sinon       = require("sinon")
rimraf      = require('rimraf')
API_URL     = process.env.API_URL or 'localhost:1234'

describe "id generation", ->
  beforeEach ->
    nock.disableNetConnect()
    @rootPath = "fake"
    @specData =
      title: "test 1"
      spec: "#{@rootPath}/spec.js"

    fs.mkdirSync(@rootPath);
    fs.writeFileSync("#{@rootPath}/spec.js", '', 'utf8');
    fs.writeFileSync("eclectus.json", '{"eclectus": {}}', 'utf8');

    global.app =
      get: (type) =>
        if (type is 'config')
          return {
            projectRoot: ''
          }

        testFolder: @rootPath

    nock("http://#{API_URL}")
    .post("/projects")
    .reply(200, {
      uuid: "6b9a82d7-3020-4f5b-a85d-14311d70b05a"
    })

    nock("http://#{API_URL}")
    .post("/projects/6b9a82d7-3020-4f5b-a85d-14311d70b05a/keys")
    .once()
    .reply(200, {
      start: 0,
      end: 10
    })

  afterEach ->
    nock.cleanAll()
    nock.enableNetConnect()
    fs.removeSync(@rootPath);
    rimraf.sync(path.join(__dirname, root, ".cy"))
    fs.removeSync("eclectus.json");

  it "generates a single id", (done) ->
    idGenerator.getId(@specData)
    .then (id) ->
      expect(id).to.eql('000')
      done()
    .catch (err) ->
      done(err)

  it "generates multiple ids", (done) ->
    idGenerator.getId(@specData)
    idGenerator.getId(@specData)
    idGenerator.getId(@specData)
    idGenerator.getId(@specData)
    idGenerator.getId(@specData)
    idGenerator.getId(@specData)
    idGenerator.getId(@specData)
    idGenerator.getId(@specData).then((d) ->
      expect(d).to.eql('007')
      done()
    )

  it "requests a new range when the current range is expired", (done) ->
    _.times(10, idGenerator.getId.bind(@, @specData))

    nock("http://#{API_URL}")
    .post("/projects/6b9a82d7-3020-4f5b-a85d-14311d70b05a/keys")
    .once()
    .reply(200, {
      start: 11,
      end: 20
    })

    idGenerator.getId(@specData).then (d) ->
      expect(d).to.eql('00b')
      done()

  context "generate:ids:for:test", ->
    beforeEach ->
      @projectRoot = "/Users/bmann/Dev/eclectus_examples/todomvc/backbone_marionette"

      @io =
        on: ->
        emit: sinon.stub()

      app =
        enabled: -> false
        get: =>
          testFolder: "tests"
          projectRoot: @projectRoot

      @socket = new Socket(@io, app)

    it "strips projectRoot out of filepath", ->
      @socket.onTestFileChange "#{@projectRoot}/tests/cypress_api.coffee"
      expect(@io.emit).to.be.calledWith "generate:ids:for:test", "tests/cypress_api.coffee", "cypress_api.coffee"
