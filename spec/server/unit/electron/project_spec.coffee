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
    it "resolves with opened project's config", ->
      project.open(@todosPath)
      .then (config) ->
        expect(config).to.be.an("object")
        expect(config).to.have.a.property("clientUrl")
        expect(config).to.have.a.property("clientUrlDisplay")

  context ".close", ->