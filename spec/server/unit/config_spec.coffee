require("../spec_helper")

_        = require("lodash")
path     = require("path")
config   = require("#{root}lib/config")
settings = require("#{root}lib/util/settings")

describe "lib/config", ->
  beforeEach ->
    @env = process.env

    process.env = _.omit(process.env, "CYPRESS_DEBUG")

  afterEach ->
    process.env = @env

  context ".get", ->
    beforeEach ->
      @sandbox.stub(settings, "readEnv").withArgs("path/to/project").resolves({foo: "bar"})
      @sandbox.stub(settings, "read").withArgs("path/to/project").resolves({})

    it "sets projectRoot", ->
      config.get("path/to/project")
      .then (obj) ->
        expect(obj.projectRoot).to.eq("path/to/project")
        expect(obj.environmentVariables).to.deep.eq({foo: "bar"})

    it "sets projectName", ->
      config.get("path/to/my-project")
      .then (obj) ->
        expect(obj.projectName).to.eq("my-project")

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

  context ".resolveConfigValues", ->
    beforeEach ->
      @expected = (obj) ->
        merged = config.resolveConfigValues(obj.config, obj.defaults, obj.resolved)
        expect(merged).to.deep.eq(obj.final)

    it "sets baseUrl to default", ->
      @expected({
        config:   {baseUrl: null}
        defaults: {baseUrl: null}
        resolved: {}
        final:    {
          baseUrl: {
            value: null
            from: "default"
          }
        }
      })

    it "sets baseUrl to config", ->
      @expected({
        config:   {baseUrl: "localhost"}
        defaults: {baseUrl: null}
        resolved: {}
        final: {
          baseUrl: {
            value: "localhost"
            from: "config"
          }
        }
      })

    it "does not change existing resolved values", ->
      @expected({
        config:   {baseUrl: "localhost"}
        defaults: {baseUrl: null}
        resolved: {baseUrl: "cli"}
        final: {
          baseUrl: {
            value: "localhost"
            from: "cli"
          }
        }
      })

    it "ignores values not found in configKeys", ->
      @expected({
        config:   {baseUrl: "localhost", foo: "bar"}
        defaults: {baseUrl: null}
        resolved: {baseUrl: "cli"}
        final: {
          baseUrl: {
            value: "localhost"
            from: "cli"
          }
        }
      })

  context ".mergeDefaults", ->
    beforeEach ->
      @defaults = (prop, value, cfg = {}, options = {}) =>
        cfg.projectRoot = "/foo/bar/"
        expect(config.mergeDefaults(cfg, options)[prop]).to.deep.eq(value)

    it "port=null", ->
      @defaults "port", null

    it "autoOpen=false", ->
      @defaults "autoOpen", false

    it "clientUrl=http://localhost:2020/__/", ->
      @defaults "clientUrl", "http://localhost:2020/__/", {port: 2020}

    it "clientUrlDisplay=http://localhost:2020", ->
      @defaults "clientUrlDisplay", "http://localhost:2020", {port: 2020}

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

    it "defaultCommandTimeout=4000", ->
      @defaults "defaultCommandTimeout", 4000

    it "pageLoadTimeout=60000", ->
      @defaults "pageLoadTimeout", 60000

    it "requestTimeout=5000", ->
      @defaults "requestTimeout", 5000

    it "responseTimeout=30000", ->
      @defaults "responseTimeout", 30000

    it "execTimeout=60000", ->
      @defaults "execTimeout", 60000

    it "waitForAnimations=true", ->
      @defaults "waitForAnimations", true

    it "animationDistanceThreshold=5", ->
      @defaults "animationDistanceThreshold", 5

    it "videoRecording=true", ->
      @defaults "videoRecording", true

    it "videoCompression=32", ->
      @defaults "videoCompression", 32

    it "trashAssetsBeforeHeadlessRuns=32", ->
      @defaults "trashAssetsBeforeHeadlessRuns", true

    it "morgan=true", ->
      @defaults "morgan", true

    it "isHeadless=false", ->
      @defaults "isHeadless", false

    it "socketId=null", ->
      @defaults "socketId", null

    it "reporter=spec", ->
      @defaults "reporter", "spec"

    it "watchForFileChanges=true", ->
      @defaults "watchForFileChanges", true

    it "numTestsKeptInMemory=50", ->
      @defaults "numTestsKeptInMemory", 50

    it "screenshotOnHeadlessFailure=true", ->
      @defaults "screenshotOnHeadlessFailure", true

    it "supportFile=false", ->
      @defaults "supportFile", false, {supportFile: false}

    it "resets numTestsKeptInMemory to 0 when headless", ->
      cfg = config.mergeDefaults({projectRoot: "/foo/bar/"}, {isHeadless: true})

      expect(cfg.numTestsKeptInMemory).to.eq(0)

    it "resets watchForFileChanges to false when headless", ->
      cfg = config.mergeDefaults({projectRoot: "/foo/bar/"}, {isHeadless: true})

      expect(cfg.watchForFileChanges).to.be.false

    it "can override morgan in options", ->
      cfg = config.mergeDefaults({projectRoot: "/foo/bar/"}, {morgan: false})

      expect(cfg.morgan).to.be.false

    it "can override isHeadless in options", ->
      cfg = config.mergeDefaults({projectRoot: "/foo/bar/"}, {isHeadless: true})

      expect(cfg.isHeadless).to.be.true

    it "can override socketId in options", ->
      cfg = config.mergeDefaults({projectRoot: "/foo/bar/"}, {socketId: 1234})

      expect(cfg.socketId).to.eq(1234)

    it "deletes envFile", ->
      obj = {
        projectRoot: "/foo/bar/"
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
        projectRoot: "/foo/bar/"
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

    describe ".resolved", ->
      it "sets reporter and port to cli", ->
        obj = {
          projectRoot: "/foo/bar"
        }

        options = {
          reporter: "json"
          port: 1234
        }

        cfg = config.mergeDefaults(obj, options)

        expect(cfg.resolved).to.deep.eq({
          port:                       { value: 1234, from: "cli" },
          hosts:                      { value: null, from: "default" }
          reporter:                   { value: "json", from: "cli" },
          reporterOptions:            { value: null, from: "default" },
          baseUrl:                    { value: null, from: "default" },
          defaultCommandTimeout:      { value: 4000, from: "default" },
          pageLoadTimeout:            { value: 60000, from: "default" },
          requestTimeout:             { value: 5000, from: "default" },
          responseTimeout:            { value: 30000, from: "default" },
          execTimeout:                { value: 60000, from: "default" },
          screenshotOnHeadlessFailure:{ value: true, from: "default" },
          numTestsKeptInMemory:       { value: 50, from: "default" },
          waitForAnimations:          { value: true, from: "default" },
          animationDistanceThreshold: { value: 5, from: "default" },
          trashAssetsBeforeHeadlessRuns: { value: true, from: "default" },
          watchForFileChanges:        { value: true, from: "default" },
          chromeWebSecurity:          { value: true, from: "default" },
          viewportWidth:              { value: 1000, from: "default" },
          viewportHeight:             { value: 660, from: "default" },
          fileServerFolder:           { value: "", from: "default" },
          videoRecording:             { value: true, from: "default" }
          videoCompression:           { value: 32, from: "default" }
          videosFolder:               { value: "cypress/videos", from: "default" },
          supportFile:                { value: "cypress/support", from: "default" },
          fixturesFolder:             { value: "cypress/fixtures", from: "default" },
          integrationFolder:          { value: "cypress/integration", from: "default" },
          screenshotsFolder:          { value: "cypress/screenshots", from: "default" },
          environmentVariables:       { }
        })

      it "sets config, envFile and env", ->
        @sandbox.stub(config, "getProcessEnvVars").returns({quux: "quux"})

        obj = {
          projectRoot: "/foo/bar"
          baseUrl: "http://localhost:8080"
          port: 2020
          env: {
            foo: "foo"
          }
          envFile: {
            bar: "bar"
          }
          environmentVariables: {
            baz: "baz"
          }
        }

        options = {}

        cfg = config.mergeDefaults(obj, options)

        expect(cfg.resolved).to.deep.eq({
          port:                       { value: 2020, from: "config" },
          hosts:                      { value: null, from: "default" }
          reporter:                   { value: "spec", from: "default" },
          reporterOptions:            { value: null, from: "default" },
          baseUrl:                    { value: "http://localhost:8080", from: "config" },
          defaultCommandTimeout:      { value: 4000, from: "default" },
          pageLoadTimeout:            { value: 60000, from: "default" },
          requestTimeout:             { value: 5000, from: "default" },
          responseTimeout:            { value: 30000, from: "default" },
          execTimeout:                { value: 60000, from: "default" },
          numTestsKeptInMemory:       { value: 50, from: "default" },
          waitForAnimations:          { value: true, from: "default" },
          animationDistanceThreshold: { value: 5, from: "default" },
          screenshotOnHeadlessFailure:{ value: true, from: "default" },
          trashAssetsBeforeHeadlessRuns: { value: true, from: "default" },
          watchForFileChanges:        { value: true, from: "default" },
          chromeWebSecurity:          { value: true, from: "default" },
          viewportWidth:              { value: 1000, from: "default" },
          viewportHeight:             { value: 660, from: "default" },
          fileServerFolder:           { value: "", from: "default" },
          videoRecording:             { value: true, from: "default" }
          videoCompression:           { value: 32, from: "default" }
          videosFolder:               { value: "cypress/videos", from: "default" },
          supportFile:                { value: "cypress/support", from: "default" },
          fixturesFolder:             { value: "cypress/fixtures", from: "default" },
          integrationFolder:          { value: "cypress/integration", from: "default" },
          screenshotsFolder:          { value: "cypress/screenshots", from: "default" },
          environmentVariables:       {
            foo: {
              value: "foo"
              from: "config"
            }
            bar: {
              value: "bar"
              from: "envFile"
            }
            baz: {
              value: "baz"
              from: "cli"
            }
            quux: {
              value: "quux"
              from: "env"
            }
          }
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

  context ".setScaffoldPaths", ->
    it "sets integrationExampleFile + integrationExampleName", ->
      obj = {
        integrationFolder: "/path/to/project/cypress/integration"
      }

      expect(config.setScaffoldPaths(obj)).to.deep.eq({
        integrationFolder: "/path/to/project/cypress/integration"
        integrationExampleFile: "/path/to/project/cypress/integration/example_spec.js"
        integrationExampleName: "example_spec.js"
      })

  context ".setSupportFileAndFolder", ->
    it "does nothing if supportFile is false", ->
      obj = {
        projectRoot: "/path/to/project"
      }

      expect(config.setSupportFileAndFolder(obj)).to.eql(obj)

    it "sets the full path to the supportFile and supportFolder if it exists", ->
      projectRoot = process.cwd()

      obj = config.setAbsolutePaths({
        projectRoot: projectRoot
        supportFile: "spec/server/unit/config_spec.coffee"
      })

      expect(config.setSupportFileAndFolder(obj)).to.eql({
        projectRoot: projectRoot
        supportFile: "#{projectRoot}/spec/server/unit/config_spec.coffee"
        supportFolder: "#{projectRoot}/spec/server/unit"
      })

    it "sets the supportFile to default index.js if it does not exist and supportFile is the default", ->
      projectRoot = process.cwd()

      obj = config.setAbsolutePaths({
        projectRoot: projectRoot
        supportFile: "cypress/support"
      })

      expect(config.setSupportFileAndFolder(obj)).to.eql({
        projectRoot: projectRoot
        supportFile: "#{projectRoot}/cypress/support/index.js"
        supportFolder: "#{projectRoot}/cypress/support"
      })

    it "throws error if supportFile is not default and does not exist", ->
      projectRoot = process.cwd()

      obj = config.setAbsolutePaths({
        projectRoot: projectRoot
        supportFile: "does/not/exist"
      })

      expect(-> config.setSupportFileAndFolder(obj)).to.throw("Support file missing or invalid")

  context ".setParentTestsPaths", ->
    it "sets parentTestsFolder and parentTestsFolderDisplay", ->
      obj = {
        projectRoot:       "/path/to/project"
        integrationFolder: "/path/to/project/cypress/integration"
      }

      expect(config.setParentTestsPaths(obj)).to.deep.eq({
        projectRoot:       "/path/to/project"
        integrationFolder: "/path/to/project/cypress/integration"
        parentTestsFolder: "/path/to/project/cypress"
        parentTestsFolderDisplay: "project/cypress"
      })

    it "sets parentTestsFolderDisplay to parentTestsFolder if they are the same", ->
      obj = {
        projectRoot:       "/path/to/project"
        integrationFolder: "/path/to/project/tests"
      }

      expect(config.setParentTestsPaths(obj)).to.deep.eq({
        projectRoot:       "/path/to/project"
        integrationFolder: "/path/to/project/tests"
        parentTestsFolder: "/path/to/project"
        parentTestsFolderDisplay: "project"
      })

  context ".setAbsolutePaths", ->
    it "is noop without projectRoot", ->
      expect(config.setAbsolutePaths({})).to.deep.eq({})

    # it "resolves fileServerFolder with projectRoot", ->
    #   obj = {
    #     projectRoot: "/path/to/project"
    #     fileServerFolder: "foo"
    #   }

    #   expect(config.setAbsolutePaths(obj)).to.deep.eq({
    #     projectRoot: "/path/to/project"
    #     fileServerFolder: "/path/to/project/foo"
    #   })

    it "does not mutate existing obj", ->
      obj = {}
      expect(config.setAbsolutePaths(obj)).not.to.eq(obj)

    it "ignores non special *folder properties", ->
      obj = {
        projectRoot: "/path/to/project"
        blehFolder: "some/rando/path"
        foo: "bar"
        baz: "quux"
      }

      expect(config.setAbsolutePaths(obj)).to.deep.eq(obj)

    ["fileServerFolder", "fixturesFolder", "integrationFolder", "unitFolder", "supportFile"].forEach (folder) ->

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
