idGenerator = require '../../../lib/id_generator'
expect      = require('chai').expect
fs          = require 'fs-extra'
_           = require 'lodash'

describe "id generation", ->
  beforeEach ->
    @rootPath = "fake"
    @specData =
      title: "test 1"
      spec: "#{@rootPath}/spec.js"

    fs.mkdirSync(@rootPath);
    fs.writeFileSync("#{@rootPath}/spec.js", '', 'utf8');

    global.app =
      get: => testFolder: @rootPath

  afterEach ->
    fs.removeSync(@rootPath);

  it "generates a single id", (done) ->
    idGenerator.getId(@specData)
    .then (id) ->
      expect(id).to.eql('000')
      done()

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
