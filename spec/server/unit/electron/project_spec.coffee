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

  context ".onSettingsChanged", ->
    it "binds to 'settings:changed' event", ->
      project.open(@todosPath)
      .then (p) ->
        process.nextTick ->
          p.emit("settings:changed")

        project.onSettingsChanged()

    it "throws when no project is open", ->
      project.onSettingsChanged()
      .catch (err) ->
        expect(err.type).to.eq("NO_CURRENTLY_OPEN_PROJECT")
