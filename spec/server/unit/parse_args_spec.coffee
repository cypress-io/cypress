require("../spec_helper")

path      = require("path")
parseArgs = require("#{root}lib/util/parse_args")

describe "parseArgs", ->
  beforeEach ->
    @setup = (args...) ->
      @options = {}
      @options.argv = args
      parseArgs(@options)

  context "--smoke-test", ->
    it "sets pong to ping", ->
      @setup("--smoke-test", "--ping=123")
      expect(@options.pong).to.eq 123

  context "--project", ->
    it "sets projectPath", ->
      projectPath = path.resolve(process.cwd(), "./foo/bar")
      @setup("--project", "./foo/bar")
      expect(@options.projectPath).to.eq projectPath

  context "--run-project", ->
    it "sets projectPath", ->
      projectPath = path.resolve(process.cwd(), "/baz")
      @setup("--run-project", "/baz")
      expect(@options.projectPath).to.eq projectPath

  context "--coords", ->
    it "sets x and y", ->
      @setup("--coords=800x600")
      expect(@options.coords).to.deep.eq({
        x: "800"
        y: "600"
      })