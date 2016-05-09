require("../../spec_helper")

Fixtures = require("../../helpers/fixtures")
project  = require("#{root}../lib/electron/handlers/project")
Project  = require("#{root}../lib/project")
launcher = require("#{root}../lib/launcher")

describe "lib/electron/handlers/projects", ->
  beforeEach ->
    Fixtures.scaffold()

    @todosPath = Fixtures.projectPath("todos")

  afterEach ->
    Fixtures.remove()

    project.close()

  context ".open", ->
    beforeEach ->
      @projectInstance = {setBrowsers: @sandbox.stub().resolves([])}
      @sandbox.stub(launcher, "getBrowsers").resolves([])

    it "resolves with opened project instance", ->
      project.open(@todosPath)
      .then (p) =>
        expect(p.projectRoot).to.eq(@todosPath)
        expect(p).to.be.an.instanceOf(Project)

    it "merges options into whitelisted config args", ->
      open = @sandbox.stub(Project.prototype, "open").resolves(@projectInstance)

      args = {port: 2222, baseUrl: "localhost", foo: "bar"}
      options = {socketId: 123, port: 2020}
      project.open(@todosPath, args, options)
      .then ->
        expect(open).to.be.calledWith({
          port: 2020
          socketId: 123
          baseUrl: "localhost"
        })

    ## TODO: write these tests!!
    it "gets browsers available for launch"

    it "sets browsers on project"

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

