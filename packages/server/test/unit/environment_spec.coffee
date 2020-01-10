require("../spec_helper")

Promise = require("bluebird")
pkg = require("@packages/root")
fs = require("#{root}lib/util/fs")
mockedEnv = require('mocked-env')
app = require("electron").app

setEnv = (env) =>
  process.env["CYPRESS_ENV"] = env
  expectedEnv(env)

expectedEnv = (env) ->
  require("#{root}lib/environment")
  expect(process.env["CYPRESS_ENV"]).to.eq(env)

setPkg = (env) =>
  pkg.env = env
  expectedEnv(env)

env = process.env["CYPRESS_ENV"]

describe "lib/environment", ->
  beforeEach ->
    sinon.stub(Promise, "config")
    delete process.env["CYPRESS_ENV"]
    delete require.cache[require.resolve("#{root}lib/environment")]

  afterEach ->
    delete require.cache[require.resolve("#{root}lib/environment")]
    delete process.env["CYPRESS_ENV"]

  after ->
    process.env["CYPRESS_ENV"] = env

  context "parses ELECTRON_EXTRA_LAUNCH_ARGS", ->
    restore = null

    beforeEach ->
      restore = mockedEnv({
        ELECTRON_EXTRA_LAUNCH_ARGS: "--foo --bar=baz --quux=true"
      })

    it "sets launch args", ->
      sinon.stub(app.commandLine, "appendArgument")
      require("#{root}lib/environment")
      expect(app.commandLine.appendArgument).to.have.been.calledWith("--foo")
      expect(app.commandLine.appendArgument).to.have.been.calledWith("--bar=baz")
      expect(app.commandLine.appendArgument).to.have.been.calledWith("--quux=true")

    afterEach ->
      restore()

  context "#existing process.env.CYPRESS_ENV", ->
    it "is production", ->
      setEnv("production")

    it "is development", ->
      setEnv("development")

    it "is staging", ->
      setEnv("staging")

  context "uses package.json env", ->
    afterEach ->
      delete pkg.env

    it "is production", ->
      setPkg("production")

    it "is staging", ->
      setPkg("staging")

    it "is test", ->
      setPkg("test")

  context "it uses development by default", ->
    beforeEach ->
      sinon.stub(fs, "readJsonSync").returns({})

    it "is development", ->
      expectedEnv("development")
