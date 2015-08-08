root   = "../../../"
expect = require("chai").expect

describe "Config", ->
  beforeEach ->
    @setup = (env) =>
      process.env["CYPRESS_ENV"] = env

      @config = require("#{root}lib/config")

      @eq = (key, val) =>
        expect(@config.app[key]).to.eq(val)

  afterEach ->
    delete require.cache[require.resolve("#{root}lib/config")]

  it "does not set global.config", ->
    delete global.config
    delete require.cache[require.resolve("#{root}lib/config")]

    require("#{root}lib/config")
    expect(global.config).not.to.be.ok

  it "memoizes the result", ->
    env = process.env["NODE_ENV"]

    process.env["NODE_ENV"] = "development"
    config = require("#{root}lib/config")

    process.env["NODE_ENV"] = "test"
    config2 = require("#{root}lib/config")

    expect(config).to.eq(config2)

  context "development", ->
    beforeEach ->
      @setup("development")

    it "cache_path", ->
      @eq("cache_path", ".cy/development/cache")

    it "api_url", ->
      @eq("api_url", "http://localhost:1234")

    it "log_path", ->
      @eq("log_path", ".cy/development")

  context "test", ->
    beforeEach ->
      @setup("test")

    it "cache_path", ->
      @eq("cache_path", ".cy/test/cache")

    it "api_url", ->
      @eq("api_url", "http://localhost:1234")

    it "log_path", ->
      @eq("log_path", ".cy/test")

  context "production", ->
    beforeEach ->
      @setup("production")

    it "cache_path", ->
      @eq("cache_path", ".cy/production/cache")

    it "log_path", ->
      @eq("log_path", ".cy/production")

    it "api_url", ->
      @eq("api_url", "http://api.cypress.io")