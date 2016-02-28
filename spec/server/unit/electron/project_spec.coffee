require("../../spec_helper")

Fixtures = require("../../helpers/fixtures")
project  = require("#{root}../lib/electron/handlers/project")
Project  = require("#{root}../lib/project")

describe "lib/electron/handlers/projects", ->
  beforeEach ->
    Fixtures.scaffold()

    @todosPath = Fixtures.projectPath("todos")

  afterEach ->
    project.close()

  context ".open", ->
    it "resolves with opened project instance", ->
      project.open(@todosPath)
      .then (p) ->
        expect(p).to.be.an.instanceOf(Project)

  context ".close", ->