Install = require("../../lib/commands/install")

describe "Install", ->
  context "cli interface", ->
    beforeEach ->
      mockery.registerMock("./commands/install", @spy = @sandbox.spy())
      @parse = (args) ->
        program.parse("node test #{args}".split(" "))

    it "calls install", ->
      @parse("install")
      expect(@spy).to.be.calledWith({})

    it "calls install with destination", ->
      @parse("install --destination /foo/bar/baz")
      expect(@spy).to.be.calledWith({destination: "/foo/bar/baz"})

  context "#download", ->
    beforeEach ->
      @options = {initialize: false}
      @install = new Install(@options)
      @exit    = @sandbox.stub(process, "exit")
      @sandbox.stub(@install, "unzip").resolves()
      @sandbox.stub(@install, "finish").resolves()

    it "downloads latest version of cypress"

    it "catches download status errors and exits", ->
      @sandbox.stub(@install, "download").rejects({statusCode: 404, statusMessage: "Not Found"})
      @install.initialize(@options).then =>
        expect(@exit).to.be.calledWith(1)

  context "#unzip", ->

  context "#finish", ->