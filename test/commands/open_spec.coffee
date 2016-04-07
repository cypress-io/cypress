path   = require("path")
utils  = require("../../lib/utils")
Open   = require("../../lib/commands/open")

describe "Open", ->
  context "cli interface", ->
    beforeEach ->
      mockery.registerMock("./commands/open", @spy = @sandbox.spy())
      @parse = (args) ->
        program.parse("node test #{args}".split(" "))

    it "calls open", ->
      @parse("open")
      expect(@spy).to.be.calledOnce

    it "calls open with port", ->
      @parse("open --port 7878")
      expect(@spy).to.be.calledWith(undefined, {port: "7878"})

    it "calls open with port with -p arg", ->
      @parse("open path/to/project -p 8989")
      expect(@spy).to.be.calledWith("path/to/project", {port: "8989"})

    it "calls open with env variables", ->
      @parse("open --env foo=bar,host=http://localhost:8888")
      expect(@spy).to.be.calledWith(undefined, {env: "foo=bar,host=http://localhost:8888"})

    it "calls open with config", ->
      @parse("open myApp --config watchForFileChanges=false,baseUrl=localhost")
      expect(@spy).to.be.calledWith("myApp", {config: "watchForFileChanges=false,baseUrl=localhost"})

  context "#constructor", ->
    beforeEach ->
      @spawn = @sandbox.stub(utils, "spawn")

      @setup = (project, options = {}) ->
        Open(project, options)

    it "calls spawn with correct options", ->
      @setup("path/to/project")

      pathToProject = path.resolve(process.cwd(), "path/to/project")
      expect(@spawn).to.be.calledWith(["--project", pathToProject], {
        xvfb: false
        detached: true
        stdio: ["ignore", "ignore", "ignore"]
      })

    it "spawns --project with port", ->
      @setup(null, {port: "1234"})
      expect(@spawn).to.be.calledWith(["--project", process.cwd(), "--port", "1234"])

    it "spawns --project with --env", ->
      @setup(null, {env: "host=http://localhost:1337,name=brian"})
      expect(@spawn).to.be.calledWith(["--project", process.cwd(), "--env", "host=http://localhost:1337,name=brian"])

    it "spawns --project with --config", ->
      @setup(null, {config: "watchForFileChanges=false,baseUrl=localhost"})
      expect(@spawn).to.be.calledWith(["--project", process.cwd(), "--config", "watchForFileChanges=false,baseUrl=localhost"])
