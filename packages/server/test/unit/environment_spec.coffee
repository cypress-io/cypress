require("../spec_helper")

Promise = require("bluebird")
pkg = require("@packages/root")
fs = require("#{root}lib/util/fs")

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
