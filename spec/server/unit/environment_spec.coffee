root   = "../../../"
sinon  = require "sinon"
fs     = require "fs-extra"
expect = require("chai").expect

describe "Environment", ->
  beforeEach ->
    @expectedEnv = (env) ->
      require("#{root}lib/environment")
      expect(process.env["NODE_ENV"]).to.eq(env)

    @sandbox = sinon.sandbox.create()

  afterEach ->
    delete require.cache[require.resolve("#{root}lib/environment")]
    delete process.env["NODE_ENV"]
    @sandbox.restore()

  context "#existing process.env.NODE_ENV", ->
    beforeEach ->
      @setEnv = (env) =>
        process.env["NODE_ENV"] = env
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
        @sandbox.stub(fs, "readJsonSync").returns({env: env})
        @expectedEnv(env)

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