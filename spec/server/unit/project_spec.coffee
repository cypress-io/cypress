root         = '../../../'
expect       = require('chai').expect
sinon        = require 'sinon'
sinonPromise = require 'sinon-as-promised'
nock         = require('nock')
fs           = require "fs-extra"
cache        = require "#{root}lib/cache"
Project      = require "#{root}lib/project"
Settings     = require "#{root}lib/util/settings"

config       = require("konfig")()

describe "Project Interface", ->
  beforeEach ->
    @sandbox = sinon.sandbox.create()

    @readReturns = (obj = {}) =>
      @sandbox.stub(Settings, "read").resolves(obj)

    @sandbox.stub(cache, "getUser").resolves({session_token: "123-456-789"})

    str = JSON.stringify({cypress: {}})
    fs.writeFileSync("cypress.json", str)

  afterEach ->
    @sandbox.restore()

    fs.removeSync("cypress.json")

  it "returns a project instance", ->
    project = Project(__dirname)
    expect(project).to.be.instanceof Project

  it "requires a projectRoot", ->
    fn = -> Project()
    expect(fn).to.throw "Instantiating lib/project requires a projectRoot!"

  context "#getProjectId", ->
    it "returns the project id from json", ->
      @readReturns({projectId: "123456"})

      project = Project("/Users/brian/app")
      project.getProjectId().then (id) ->
        expect(id).to.eq "123456"

  context "#createProjectId", ->
    beforeEach ->
      @project = Project process.cwd()

      @createProject = nock(config.app.api_url)
      .matchHeader("X-Session", "123-456-789")
      .post("/projects")
      .reply(200, {
        uuid: "abc-1234-foo-bar-baz"
      })

    afterEach ->
      nock.cleanAll()

    it "POSTs for a projectId", ->
      project = Project(process.cwd())
      project.createProjectId().then =>
        @createProject.done()

    it "writes projectId to cypress.json", ->
      @project.createProjectId().then (id) =>
        Settings.read(@project.projectRoot).then (settings) ->
          expect(settings).to.deep.eq {projectId: id}

    it "returns the projectId", ->
      @project.createProjectId().then (id) ->
        expect(id).to.eq "abc-1234-foo-bar-baz"

  context "#ensureProjectId", ->
    beforeEach ->
      @project = Project process.cwd()

      @createProject = nock(config.app.api_url)
      .matchHeader("X-Session", "123-456-789")
      .post("/projects")
      .reply(200, {
        uuid: "abc-1234-foo-bar-baz"
      })

    afterEach ->
      nock.cleanAll()

    it "returns the project id if existing", ->
      @readReturns({projectId: "123456"})

      @project.ensureProjectId().then (id) =>
        expect(id).to.eq "123456"
        expect(@createProject.isDone()).to.be.false

    it "creates a project id and returns it if not existing", ->
      @readReturns({})

      @project.ensureProjectId().then (id) =>
        expect(id).to.eq "abc-1234-foo-bar-baz"
        @createProject.isDone()