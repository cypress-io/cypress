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
      expect(@spy).to.be.calledWith({port: "7878"})

    it "calls open with port with -p arg", ->
      @parse("open -p 8989")
      expect(@spy).to.be.calledWith({port: "8989"})

    it "calls open with env variables", ->
      @parse("open --env foo=bar,host=http://localhost:8888")
      expect(@spy).to.be.calledWith({env: "foo=bar,host=http://localhost:8888"})

    it "calls open with config", ->
      @parse("open --config watchForFileChanges=false,baseUrl=localhost")
      expect(@spy).to.be.calledWith({config: "watchForFileChanges=false,baseUrl=localhost"})

  context "#constructor", ->
    beforeEach ->
      @spawn = @sandbox.stub(utils, "spawn")

      @setup = (options = {}) ->
        Open(options)

    it "calls spawn with correct options", ->
      @setup()

      expect(@spawn).to.be.calledWith([], {
        detached: true
        stdio: ["ignore", "ignore", "ignore"]
      })

    it "spawns with port", ->
      @setup({port: "1234"})
      expect(@spawn).to.be.calledWith(["--port", "1234"])

    it "spawns --project with --env", ->
      @setup({env: "host=http://localhost:1337,name=brian"})
      expect(@spawn).to.be.calledWith(["--env", "host=http://localhost:1337,name=brian"])

    it "spawns --project with --config", ->
      @setup({config: "watchForFileChanges=false,baseUrl=localhost"})
      expect(@spawn).to.be.calledWith(["--config", "watchForFileChanges=false,baseUrl=localhost"])
