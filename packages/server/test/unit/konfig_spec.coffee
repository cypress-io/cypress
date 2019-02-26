require("../spec_helper")

describe "lib/konfig", ->
  beforeEach ->
    @env = process.env["CYPRESS_ENV"]

    @setup = (env) =>
      process.env["CYPRESS_ENV"] = env

      @konfig = require("#{root}lib/konfig")

      @eq = (key, val) =>
        expect(@konfig(key)).to.eq(val)

  afterEach ->
    process.env["CYPRESS_ENV"] = @env

    delete require.cache[require.resolve("#{root}lib/konfig")]

  it "does not set global.config", ->
    delete global.config
    delete require.cache[require.resolve("#{root}lib/konfig")]

    require("#{root}lib/konfig")
    expect(global.config).not.to.be.ok

  it "memoizes the result", ->
    env = process.env["NODE_ENV"]

    process.env["NODE_ENV"] = "development"
    config = require("#{root}lib/konfig")

    process.env["NODE_ENV"] = "test"
    config2 = require("#{root}lib/konfig")

    expect(config).to.eq(config2)

  it "does not add NODE_ENV to process env if input env did not contain one", ->
    env = process.env["NODE_ENV"]
    delete process.env["NODE_ENV"]
    delete require.cache[require.resolve("#{root}lib/konfig")]
    expect(process.env.hasOwnProperty('NODE_ENV')).to.eq(false)
    config = require("#{root}lib/konfig")
    expect(process.env.hasOwnProperty('NODE_ENV')).to.eq(false)
    process.env["NODE_ENV"] = env

  context "development", ->
    beforeEach ->
      @setup("development")

    it "api_url", ->
      @eq("api_url", "http://localhost:1234/")

  context "test", ->
    beforeEach ->
      @setup("test")

    it "api_url", ->
      @eq("api_url", "http://localhost:1234/")

  context "production", ->
    beforeEach ->
      @setup("production")

    it "api_url", ->
      @eq("api_url", "https://api.cypress.io/")
