path   = require("path")
utils  = require("../../lib/utils")
Key    = require("../../lib/commands/key")

describe "Key", ->
  context "cli interface", ->
    beforeEach ->
      mockery.registerMock("./commands/key", @spy = @sandbox.spy())
      @parse = (args) ->
        program.parse("node test #{args}".split(" "))

    it "calls key", ->
      @parse("get:key")
      expect(@spy).to.be.calledWith(undefined)

    it "calls key with path to project", ->
      @parse("get:key /foo/bar/baz")
      expect(@spy).to.be.calledWith("/foo/bar/baz")

    it "calls key with reset: true", ->
      @parse("new:key /foo/bar/baz")
      expect(@spy).to.be.calledWith("/foo/bar/baz", {reset: true})

  context "#getKey / #setKey", ->
    beforeEach ->
      @spawn = @sandbox.stub(utils, "spawn")

      @setup = (pathToProject, options = {}) =>
        @getKey = Key(pathToProject, options)

    it "spawns --get-key with --project", ->
      @setup()
      pathToProject = path.resolve(process.cwd(), ".")
      expect(@spawn).to.be.calledWith(["--get-key", "--project", pathToProject])

    it "resolves project path", ->
      @setup("/foo/bar")
      expect(@spawn).to.be.calledWith(["--get-key", "--project", "/foo/bar"])

    it "spawns --new-key with --project", ->
      @setup(null, {reset: true})
      pathToProject = path.resolve(process.cwd(), ".")
      expect(@spawn).to.be.calledWith(["--new-key", "--project", pathToProject])

    it "resolves project path", ->
      @setup("/foo/bar", {reset: true})
      expect(@spawn).to.be.calledWith(["--new-key", "--project", "/foo/bar"])