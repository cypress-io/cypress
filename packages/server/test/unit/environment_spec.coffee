require("../spec_helper")

pkg = require("@packages/root")

describe "lib/environment", ->
  before ->
    @env = process.env["CYPRESS_ENV"]

  beforeEach ->
    @expectedEnv = (env) ->
      require("#{root}lib/environment")
      expect(process.env["CYPRESS_ENV"]).to.eq(env)

  afterEach ->
    delete require.cache[require.resolve("#{root}lib/environment")]
    delete process.env["CYPRESS_ENV"]

  after ->
    process.env["CYPRESS_ENV"] = @env

  context "#existing process.env.CYPRESS_ENV", ->
    beforeEach ->
      @setEnv = (env) =>
        process.env["CYPRESS_ENV"] = env
        @expectedEnv(env)

    it "is production", ->
      @setEnv("production")

    it "is development", ->
      @setEnv("development")

    it "is staging", ->
      @setEnv("staging")

  context "uses package.json env", ->
    beforeEach ->
      @setEnv = (env) =>
        pkg.env = env
        @expectedEnv(env)

    afterEach ->
      delete pkg.env

    it "is production", ->
      @setEnv("production")

    it "is staging", ->
      @setEnv("staging")

    it "is test", ->
      @setEnv("test")

  context "it uses development by default", ->
    beforeEach ->
      @sandbox.stub(fs, "readJsonSync").returns({})

    it "is development", ->
      @expectedEnv("development")
