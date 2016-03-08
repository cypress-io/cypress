require("../spec_helper")

path     = require("path")
argsUtil = require("#{root}lib/util/args")

describe "lib/util/args", ->
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

  context ".toArray", ->
    beforeEach ->
      @obj = {coords: {x: 1, y: 2}, _coords: "1x2", project: "foo/bar"}

    it "rejects values which have an cooresponding underscore'd key", ->
      expect(argsUtil.toArray(@obj)).to.deep.eq(["--project=foo/bar", "--coords=1x2"])

  context ".toObject", ->
    beforeEach ->
      @obj = @setup("--get-key", "--coords=1x2", "--env=foo=bar,baz=quux")

    it "backs up coords + environmentVariables", ->
      expect(@obj).to.deep.eq({
        _: []
        env: process.env.NODE_ENV
        "get-key": true
        getKey: true
        _coords: "1x2"
        coords: {x: 1, y: 2}
        _environmentVariables: "foo=bar,baz=quux"
        environmentVariables: {
          foo: "bar"
          baz: "quux"
        }
      })

    it "can transpose back to an array", ->
      expect(argsUtil.toArray(@obj)).to.deep.eq([
        "--getKey=true", "--coords=1x2", "--environmentVariables=foo=bar,baz=quux"
      ])