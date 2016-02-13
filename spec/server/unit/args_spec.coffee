require("../spec_helper")

path     = require("path")
argsUtil = require("#{root}lib/util/args")

describe "util/args", ->
  beforeEach ->
    @setup = (args...) ->
      argsUtil.toObject(args)

  context "--smoke-test", ->
    it "sets pong to ping", ->
      options = @setup("--smoke-test", "--ping=123")
      expect(options.pong).to.eq 123

  context "--project", ->
    it "sets projectPath", ->
      projectPath = path.resolve(process.cwd(), "./foo/bar")
      options = @setup("--project", "./foo/bar")
      expect(options.projectPath).to.eq projectPath

  context "--run-project", ->
    it "sets projectPath", ->
      projectPath = path.resolve(process.cwd(), "/baz")
      options = @setup("--run-project", "/baz")
      expect(options.projectPath).to.eq projectPath

  context "--coords", ->
    it "sets x and y", ->
      options = @setup("--coords=800x600")
      expect(options.coords).to.deep.eq({
        x: "800"
        y: "600"
      })

  context "--port", ->
    it "converts to Number", ->
      options = @setup("--port", "8080")
      expect(options.port).to.eq(8080)

  context "--env", ->
    it "converts to object literal", ->
      options = @setup("--env", "foo=bar,version=0.12.1,host=localhost:8888")
      expect(options.environmentVariables).to.deep.eq({
        foo: "bar"
        version: "0.12.1"
        host: "localhost:8888"
      })
