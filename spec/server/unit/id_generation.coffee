idGenerator = require '../../../lib/id_generator'
expect      = require('chai').expect
fs          = require 'fs-extra'
_           = require 'lodash'
nock        = require('nock')
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
      get: => testFolder: @rootPath

    nock("http://#{API_URL}")
    .post("/projects")
    .reply(200, {
      uuid: "6b9a82d7-3020-4f5b-a85d-14311d70b05a"
    })

    nock("http://#{API_URL}")
    .post("/projects/6b9a82d7-3020-4f5b-a85d-14311d70b05a/keys")
    .reply(200, {
      start: 0,
      end: 100
    })

  afterEach ->
    nock.cleanAll()
    nock.enableNetConnect()
    fs.removeSync(@rootPath);
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
