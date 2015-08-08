root       = "../../../"
expect     = require("chai").expect
proxyquire = require("proxyquire").noPreserveCache()

describe "Environment", ->
  beforeEach ->
    @expectedEnv = (env) ->
      require("#{root}lib/environment")
      expect(process.env["CYPRESS_ENV"]).to.eq(env)

  afterEach ->
    delete require.cache[require.resolve("#{root}lib/environment")]
    delete process.env["CYPRESS_ENV"]

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
        proxyquire("#{root}lib/environment", {
          "../package.json": {env: env}
        })
        @expectedEnv(env)

    it "is production", ->
      @setEnv("production")

    it "is staging", ->
      @setEnv("staging")

    it "is test", ->
      @setEnv("test")

  context "it uses development by default", ->
    it "is development", ->
      @expectedEnv("development")