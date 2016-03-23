require("../spec_helper")

config   = require("#{root}lib/config")
settings = require("#{root}lib/util/settings")

describe "lib/config", ->
  context ".get", ->
    beforeEach ->
      @sandbox.stub(settings, "readEnv").withArgs("path/to/project").resolves({foo: "bar"})
      @sandbox.stub(settings, "read").withArgs("path/to/project").resolves({})

    it "sets projectRoot", ->
      config.get("path/to/project")
      .then (obj) ->
        expect(obj.projectRoot).to.eq("path/to/project")
        expect(obj.environmentVariables).to.deep.eq({foo: "bar"})

    context "port", ->
      it "can override default port", ->
        config.get("path/to/project", {port: 8080})
        .then (obj) ->
          expect(obj.port).to.eq(8080)

      it "updates clientUrl", ->
        config.get("path/to/project", {port: 8080})
        .then (obj) ->
          expect(obj.clientUrl).to.eq "http://localhost:8080/__/"

      it "updates clientUrlDisplay", ->
        config.get("path/to/project", {port: 8080})
        .then (obj) ->
          expect(obj.clientUrlDisplay).to.eq "http://localhost:8080"

  context ".mergeDefaults", ->
    beforeEach ->
      @defaults = (prop, value, cfg = {}, options = {}) =>
        expect(config.mergeDefaults(cfg, options)[prop]).to.deep.eq(value)

    it "port=2020", ->
      @defaults "port", 2020

    it "autoOpen=false", ->
      @defaults "autoOpen", false

    it "clientUrl=http://localhost:2020/__/", ->
      @defaults "clientUrl", "http://localhost:2020/__/"

    it "clientUrlDisplay=http://localhost:2020", ->
      @defaults "clientUrlDisplay", "http://localhost:2020"

    it "namespace=__cypress", ->
      @defaults "namespace", "__cypress"

    it "baseUrl=http://localhost:8000/app", ->
      @defaults "baseUrl", "http://localhost:8000/app", {
        baseUrl: "http://localhost:8000/app//"
      }

    it "javascripts=[]", ->
      @defaults "javascripts", []

    it "viewportWidth=1000", ->
      @defaults "viewportWidth", 1000

    it "viewportHeight=660", ->
      @defaults "viewportHeight", 660

    it "baseUrl=null", ->
      @defaults "baseUrl", null

    it "env=CYPRESS_ENV", ->
      @defaults "env", process.env["CYPRESS_ENV"]

    it "commandTimeout=4000", ->
      @defaults "commandTimeout", 4000

    it "visitTimeout=30000", ->
      @defaults "visitTimeout", 30000

    it "requestTimeout=5000", ->
      @defaults "requestTimeout", 5000

    it "responseTimeout=20000", ->
      @defaults "responseTimeout", 20000

    it "waitForAnimations=true", ->
      @defaults "waitForAnimations", true

    it "animationDistanceThreshold=5", ->
      @defaults "animationDistanceThreshold", 5

    it "deletes envFile", ->
      obj = {
        env: {
          foo: "bar"
          version: "0.5.2"
        }
        envFile: {
          bar: "baz"
          version: "1.0.1"
        }
      }

      cfg = config.mergeDefaults(obj)

      expect(cfg.environmentVariables).to.deep.eq({
        foo: "bar"
        bar: "baz"
        version: "1.0.1"
      })
      expect(cfg.env).to.eq(process.env["CYPRESS_ENV"])
      expect(cfg).not.to.have.property("envFile")

    it "merges env into @config.env", ->
      obj = {
        env: {
          host: "localhost"
          user: "brian"
          version: "0.12.2"
        }
      }

      options = {
        environmentVariables: {
          version: "0.13.1"
          foo: "bar"
        }
      }

      cfg = config.mergeDefaults(obj, options)

      expect(cfg.environmentVariables).to.deep.eq({
        host: "localhost"
        user: "brian"
        version: "0.13.1"
        foo: "bar"
      })

  context ".parseEnv", ->
    it "merges together env from config, env from file, env from process, and env from CLI", ->
      @sandbox.stub(config, "getProcessEnvVars").returns({version: "0.12.1", user: "bob"})

      obj = {
        env: {
          version: "0.10.9"
          project: "todos"
          host: "localhost"
          baz: "quux"
        }

        envFile: {
          host: "http://localhost:8888"
          user: "brian"
          foo: "bar"
        }

        environmentVariables: {
          version: "0.14.0"
          project: "pie"
        }
      }

      expect(config.parseEnv(obj)).to.deep.eq({
        version: "0.14.0"
        project: "pie"
        host: "http://localhost:8888"
        user: "bob"
        foo: "bar"
        baz: "quux"
      })

  context ".getProcessEnvVars", ->
    ["cypress_", "CYPRESS_"].forEach (key) ->

      it "reduces key: #{key}", ->
        obj = {
          cypress_host: "http://localhost:8888"
          foo: "bar"
          env: "123"
        }

        obj[key + "version"] = "0.12.0"

        expect(config.getProcessEnvVars(obj)).to.deep.eq({
          host: "http://localhost:8888"
          version: "0.12.0"
        })

    it "does not merge CYPRESS_ENV", ->
      obj = {
        CYPRESS_ENV: "production"
        CYPRESS_FOO: "bar"
      }

      expect(config.getProcessEnvVars(obj)).to.deep.eq({
        FOO: "bar"
      })

  context ".setUrls", ->
    it "does not mutate existing obj", ->
      obj = {}
      expect(config.setUrls(obj)).not.to.eq(obj)

  context ".setAbsolutePaths", ->
    it "is noop without projectRoot", ->
      expect(config.setAbsolutePaths({})).to.deep.eq({})

    it "does not mutate existing obj", ->
      obj = {}
      expect(config.setAbsolutePaths(obj)).not.to.eq(obj)

    it "ignores non special *folder properties", ->
      obj = {
        projectRoot: "path/to/project"
        blehFolder: "some/rando/path"
        foo: "bar"
        baz: "quux"
      }

      expect(config.setAbsolutePaths(obj)).to.deep.eq(obj)

    ["supportFolder", "fixturesFolder", "integrationFolder", "unitFolder"].forEach (folder) ->

      it "converts relative #{folder} to absolute path", ->
        obj = {
          projectRoot: "/path/to/project"
        }
        obj[folder] = "foo/bar"

        expected = {
          projectRoot: "/path/to/project"
        }
        expected[folder] = "/path/to/project/foo/bar"

        expect(config.setAbsolutePaths(obj)).to.deep.eq(expected)
