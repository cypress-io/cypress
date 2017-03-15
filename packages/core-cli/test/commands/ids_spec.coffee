path   = require("path")
utils  = require("../../lib/utils")
Ids    = require("../../lib/commands/ids")

describe "Ids", ->
  context "cli interface", ->
    beforeEach ->
      mockery.registerMock("./commands/ids", @spy = @sandbox.spy())
      @parse = (args) ->
        program.parse("node test #{args}".split(" "))

    it "calls ids", ->
      @parse("remove:ids")
      expect(@spy).to.be.calledWith(undefined)

    it "calls ids with path to project", ->
      @parse("remove:ids /foo/bar/baz")
      expect(@spy).to.be.calledWith("/foo/bar/baz")

  context "#removeIds", ->
    beforeEach ->
      @spawn = @sandbox.stub(utils, "spawn")

      @setup = (pathToProject, options = {}) =>
        Ids(pathToProject, options)

    it "spawns --remove-ids with --project", ->
      @setup()
      pathToProject = path.resolve(process.cwd(), ".")
      expect(@spawn).to.be.calledWith(["--remove-ids", "--project", pathToProject])

    it "resolves project path", ->
      @setup("/foo/bar")
      expect(@spawn).to.be.calledWith(["--remove-ids", "--project", "/foo/bar"])