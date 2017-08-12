require("../spec_helper")

_        = require("lodash")
path     = require("path")
config   = require("#{root}lib/config")
configUtil = require("#{root}lib/util/config")
scaffold = require("#{root}lib/scaffold")
settings = require("#{root}lib/util/settings")

describe "lib/config", ->
  beforeEach ->
    @env = process.env

    process.env = _.omit(process.env, "CYPRESS_DEBUG")

  afterEach ->
    process.env = @env

  context ".get", ->
    beforeEach ->
      @projectPath = "/_test-output/path/to/project"
      @setup = (cypressJson = {}, cypressEnvJson = {}) =>
        @sandbox.stub(settings, "read").withArgs(@projectPath).resolves(cypressJson)
        @sandbox.stub(settings, "readEnv").withArgs(@projectPath).resolves(cypressEnvJson)

    it "sets projectRoot", ->
      @setup({}, {foo: "bar"})
      config.get(@projectPath)
      .then (obj) =>
        expect(obj.projectRoot).to.eq(@projectPath)
        expect(obj.environmentVariables).to.deep.eq({foo: "bar"})

    it "sets projectName", ->
      @setup({}, {foo: "bar"})
      config.get(@projectPath)
      .then (obj) ->
        expect(obj.projectName).to.eq("project")

    context "port", ->
      beforeEach ->
        @setup({}, {foo: "bar"})

      it "can override default port", ->
        config.get(@projectPath, {port: 8080})
        .then (obj) ->
          expect(obj.port).to.eq(8080)

      it "updates browserUrl", ->
        config.get(@projectPath, {port: 8080})
        .then (obj) ->
          expect(obj.browserUrl).to.eq "http://localhost:8080/__/"

      it "updates proxyUrl", ->
        config.get(@projectPath, {port: 8080})
        .then (obj) ->
          expect(obj.proxyUrl).to.eq "http://localhost:8080"

    context "validation", ->
      beforeEach ->
        @expectValidationPasses = =>
          config.get(@projectPath) ## shouldn't throw

        @expectValidationFails = (errorMessage = "validation error") =>
          config.get(@projectPath)
          .then ->
            throw new Error("should throw validation error")
          .catch (err) ->
            expect(err.message).to.include(errorMessage)

      it "values are optional", ->
        @setup()
        @expectValidationPasses()

      it "validates cypress.json", ->
        @setup({reporter: 5})
        @expectValidationFails("cypress.json")

      it "validates cypress.env.json", ->
        @setup({}, {reporter: 5})
        @expectValidationFails("cypress.env.json")

      it "only validates known values", ->
        @setup({foo: "bar"})
        @expectValidationPasses()

      context "animationDistanceThreshold", ->
        it "passes if a number", ->
          @setup({animationDistanceThreshold: 10})
          @expectValidationPasses()

        it "fails if not a number", ->
          @setup({animationDistanceThreshold: {foo: "bar"}})
          @expectValidationFails("be a number")
          @expectValidationFails("the value was: {\"foo\":\"bar\"}")

      context "baseUrl", ->
        it "passes if begins with http://", ->
          @setup({baseUrl: "http://example.com"})
          @expectValidationPasses()

        it "passes if begins with https://", ->
          @setup({baseUrl: "https://example.com"})
          @expectValidationPasses()

        it "fails if not a string", ->
          @setup({baseUrl: false})
          @expectValidationFails("be a fully qualified URL")

        it "fails if not a fully qualified url", ->
          @setup({baseUrl: "localhost"})
          @expectValidationFails("be a fully qualified URL")

      context "chromeWebSecurity", ->
        it "passes if a boolean", ->
          @setup({chromeWebSecurity: false})
          @expectValidationPasses()

        it "fails if not a boolean", ->
          @setup({chromeWebSecurity: 42})
          @expectValidationFails("be a boolean")
          @expectValidationFails("the value was: 42")

      context "defaultCommandTimeout", ->
        it "passes if a number", ->
          @setup({defaultCommandTimeout: 10})
          @expectValidationPasses()

        it "fails if not a number", ->
          @setup({defaultCommandTimeout: "foo"})
          @expectValidationFails("be a number")
          @expectValidationFails("the value was: \"foo\"")

      context "env", ->
        it "passes if an object", ->
          @setup({env: {}})
          @expectValidationPasses()

        it "fails if not an object", ->
          @setup({env: "not an object that's for sure"})
          @expectValidationFails("a plain object")

      context "execTimeout", ->
        it "passes if a number", ->
          @setup({execTimeout: 10})
          @expectValidationPasses()

        it "fails if not a number", ->
          @setup({execTimeout: "foo"})
          @expectValidationFails("be a number")

      context "fileServerFolder", ->
        it "passes if a string", ->
          @setup({fileServerFolder: "_files"})
          @expectValidationPasses()

        it "fails if not a string", ->
          @setup({fileServerFolder: true})
          @expectValidationFails("be a string")
          @expectValidationFails("the value was: true")

      context "fixturesFolder", ->
        it "passes if a string", ->
          @setup({fixturesFolder: "_fixtures"})
          @expectValidationPasses()

        it "passes if false", ->
          @setup({fixturesFolder: false})
          @expectValidationPasses()

        it "fails if not a string or false", ->
          @setup({fixturesFolder: true})
          @expectValidationFails("be a string or false")

      context "ignoreTestFiles", ->
        it "passes if a string", ->
          @setup({ignoreTestFiles: "*.jsx"})
          @expectValidationPasses()

        it "passes if an array of strings", ->
          @setup({ignoreTestFiles: ["*.jsx"]})
          @expectValidationPasses()

        it "fails if not a string or array", ->
          @setup({ignoreTestFiles: 5})
          @expectValidationFails("be a string or an array of string")

        it "fails if not an array of strings", ->
          @setup({ignoreTestFiles: [5]})
          @expectValidationFails("be a string or an array of string")
          @expectValidationFails("the value was: [5]")

      context "integrationFolder", ->
        it "passes if a string", ->
          @setup({integrationFolder: "_tests"})
          @expectValidationPasses()

        it "fails if not a string", ->
          @setup({integrationFolder: true})
          @expectValidationFails("be a string")

      context "numTestsKeptInMemory", ->
        it "passes if a number", ->
          @setup({numTestsKeptInMemory: 10})
          @expectValidationPasses()

        it "fails if not a number", ->
          @setup({numTestsKeptInMemory: "foo"})
          @expectValidationFails("be a number")

      context "pageLoadTimeout", ->
        it "passes if a number", ->
          @setup({pageLoadTimeout: 10})
          @expectValidationPasses()

        it "fails if not a number", ->
          @setup({pageLoadTimeout: "foo"})
          @expectValidationFails("be a number")

      context "port", ->
        it "passes if a number", ->
          @setup({port: 10})
          @expectValidationPasses()

        it "fails if not a number", ->
          @setup({port: "foo"})
          @expectValidationFails("be a number")

      context "reporter", ->
        it "passes if a string", ->
          @setup({reporter: "_custom"})
          @expectValidationPasses()

        it "fails if not a string", ->
          @setup({reporter: true})
          @expectValidationFails("be a string")

      context "requestTimeout", ->
        it "passes if a number", ->
          @setup({requestTimeout: 10})
          @expectValidationPasses()

        it "fails if not a number", ->
          @setup({requestTimeout: "foo"})
          @expectValidationFails("be a number")

      context "responseTimeout", ->
        it "passes if a number", ->
          @setup({responseTimeout: 10})
          @expectValidationPasses()

        it "fails if not a number", ->
          @setup({responseTimeout: "foo"})
          @expectValidationFails("be a number")

      context "screenshotOnHeadlessFailure", ->
        it "passes if a boolean", ->
          @setup({screenshotOnHeadlessFailure: false})
          @expectValidationPasses()

        it "fails if not a boolean", ->
          @setup({screenshotOnHeadlessFailure: 42})
          @expectValidationFails("be a boolean")

      context "supportFile", ->
        it "passes if a string", ->
          @setup({supportFile: "cypress/support"})
          @expectValidationPasses()

        it "passes if false", ->
          @setup({supportFile: false})
          @expectValidationPasses()

        it "fails if not a string or false", ->
          @setup({supportFile: true})
          @expectValidationFails("be a string or false")

      context "trashAssetsBeforeHeadlessRuns", ->
        it "passes if a boolean", ->
          @setup({trashAssetsBeforeHeadlessRuns: false})
          @expectValidationPasses()

        it "fails if not a boolean", ->
          @setup({trashAssetsBeforeHeadlessRuns: 42})
          @expectValidationFails("be a boolean")

      context "videoCompression", ->
        it "passes if a number", ->
          @setup({videoCompression: 10})
          @expectValidationPasses()

        it "passes if false", ->
          @setup({videoCompression: false})
          @expectValidationPasses()

        it "fails if not a number", ->
          @setup({videoCompression: "foo"})
          @expectValidationFails("be a number or false")

      context "videoRecording", ->
        it "passes if a boolean", ->
          @setup({videoRecording: false})
          @expectValidationPasses()

        it "fails if not a boolean", ->
          @setup({videoRecording: 42})
          @expectValidationFails("be a boolean")

      context "videosFolder", ->
        it "passes if a string", ->
          @setup({videosFolder: "_videos"})
          @expectValidationPasses()

        it "fails if not a string", ->
          @setup({videosFolder: true})
          @expectValidationFails("be a string")

      context "viewportHeight", ->
        it "passes if a number", ->
          @setup({viewportHeight: 10})
          @expectValidationPasses()

        it "fails if not a number", ->
          @setup({viewportHeight: "foo"})
          @expectValidationFails("be a number")

      context "viewportWidth", ->
        it "passes if a number", ->
          @setup({viewportWidth: 10})
          @expectValidationPasses()

        it "fails if not a number", ->
          @setup({viewportWidth: "foo"})
          @expectValidationFails("be a number")

      context "waitForAnimations", ->
        it "passes if a boolean", ->
          @setup({waitForAnimations: false})
          @expectValidationPasses()

        it "fails if not a boolean", ->
          @setup({waitForAnimations: 42})
          @expectValidationFails("be a boolean")

      context "watchForFileChanges", ->
        it "passes if a boolean", ->
          @setup({watchForFileChanges: false})
          @expectValidationPasses()

        it "fails if not a boolean", ->
          @setup({watchForFileChanges: 42})
          @expectValidationFails("be a boolean")

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

    it "browserUrl=http://localhost:2020/__/", ->
      @defaults "browserUrl", "http://localhost:2020/__/", {port: 2020}

    it "proxyUrl=http://localhost:2020", ->
      @defaults "proxyUrl", "http://localhost:2020", {port: 2020}

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

    it "isTextTerminal=false", ->
      @defaults "isTextTerminal", false

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
      cfg = config.mergeDefaults({projectRoot: "/foo/bar/"}, {isTextTerminal: true})

      expect(cfg.numTestsKeptInMemory).to.eq(0)

    it "resets watchForFileChanges to false when headless", ->
      cfg = config.mergeDefaults({projectRoot: "/foo/bar/"}, {isTextTerminal: true})

      expect(cfg.watchForFileChanges).to.be.false

    it "can override morgan in options", ->
      cfg = config.mergeDefaults({projectRoot: "/foo/bar/"}, {morgan: false})

      expect(cfg.morgan).to.be.false

    it "can override isTextTerminal in options", ->
      cfg = config.mergeDefaults({projectRoot: "/foo/bar/"}, {isTextTerminal: true})

      expect(cfg.isTextTerminal).to.be.true

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

    it "uses baseUrl when set", ->
      obj = {
        port: 65432
        baseUrl: "https://www.google.com"
        clientRoute: "/__/"
      }

      urls = config.setUrls(obj)

      expect(urls.browserUrl).to.eq("https://www.google.com/__/")
      expect(urls.proxyUrl).to.eq("http://localhost:65432")

    it "strips baseUrl to host when set", ->
      obj = {
        port: 65432
        baseUrl: "http://localhost:9999/app/?foo=bar#index.html"
        clientRoute: "/__/"
      }

      urls = config.setUrls(obj)

      expect(urls.browserUrl).to.eq("http://localhost:9999/__/")
      expect(urls.proxyUrl).to.eq("http://localhost:65432")

  context ".setScaffoldPaths", ->
    it "sets integrationExampleFile + integrationExampleName + scaffoldedFiles", ->
      obj = {
        integrationFolder: "/_test-output/path/to/project/cypress/integration"
      }
      @sandbox.stub(scaffold, "fileTree").returns([])

      expect(config.setScaffoldPaths(obj)).to.deep.eq({
        integrationFolder: "/_test-output/path/to/project/cypress/integration"
        integrationExampleFile: "/_test-output/path/to/project/cypress/integration/example_spec.js"
        integrationExampleName: "example_spec.js"
        scaffoldedFiles: []
      })

  context ".setSupportFileAndFolder", ->
    it "does nothing if supportFile is false", ->
      obj = {
        projectRoot: "/_test-output/path/to/project"
      }

      expect(config.setSupportFileAndFolder(obj)).to.eql(obj)

    it "sets the full path to the supportFile and supportFolder if it exists", ->
      projectRoot = process.cwd()

      obj = config.setAbsolutePaths({
        projectRoot: projectRoot
        supportFile: "test/unit/config_spec.coffee"
      })

      expect(config.setSupportFileAndFolder(obj)).to.eql({
        projectRoot: projectRoot
        supportFile: "#{projectRoot}/test/unit/config_spec.coffee"
        supportFolder: "#{projectRoot}/test/unit"
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

      expect(-> config.setSupportFileAndFolder(obj)).to.throw("Support file missing or invalid.")

  context ".setParentTestsPaths", ->
    it "sets parentTestsFolder and parentTestsFolderDisplay", ->
      obj = {
        projectRoot:       "/_test-output/path/to/project"
        integrationFolder: "/_test-output/path/to/project/cypress/integration"
      }

      expect(config.setParentTestsPaths(obj)).to.deep.eq({
        projectRoot:       "/_test-output/path/to/project"
        integrationFolder: "/_test-output/path/to/project/cypress/integration"
        parentTestsFolder: "/_test-output/path/to/project/cypress"
        parentTestsFolderDisplay: "project/cypress"
      })

    it "sets parentTestsFolderDisplay to parentTestsFolder if they are the same", ->
      obj = {
        projectRoot:       "/_test-output/path/to/project"
        integrationFolder: "/_test-output/path/to/project/tests"
      }

      expect(config.setParentTestsPaths(obj)).to.deep.eq({
        projectRoot:       "/_test-output/path/to/project"
        integrationFolder: "/_test-output/path/to/project/tests"
        parentTestsFolder: "/_test-output/path/to/project"
        parentTestsFolderDisplay: "project"
      })

  context ".setAbsolutePaths", ->
    it "is noop without projectRoot", ->
      expect(config.setAbsolutePaths({})).to.deep.eq({})

    # it "resolves fileServerFolder with projectRoot", ->
    #   obj = {
    #     projectRoot: "/_test-output/path/to/project"
    #     fileServerFolder: "foo"
    #   }

    #   expect(config.setAbsolutePaths(obj)).to.deep.eq({
    #     projectRoot: "/_test-output/path/to/project"
    #     fileServerFolder: "/_test-output/path/to/project/foo"
    #   })

    it "does not mutate existing obj", ->
      obj = {}
      expect(config.setAbsolutePaths(obj)).not.to.eq(obj)

    it "ignores non special *folder properties", ->
      obj = {
        projectRoot: "/_test-output/path/to/project"
        blehFolder: "some/rando/path"
        foo: "bar"
        baz: "quux"
      }

      expect(config.setAbsolutePaths(obj)).to.deep.eq(obj)

    ["fileServerFolder", "fixturesFolder", "integrationFolder", "unitFolder", "supportFile"].forEach (folder) ->

      it "converts relative #{folder} to absolute path", ->
        obj = {
          projectRoot: "/_test-output/path/to/project"
        }
        obj[folder] = "foo/bar"

        expected = {
          projectRoot: "/_test-output/path/to/project"
        }
        expected[folder] = "/_test-output/path/to/project/foo/bar"

        expect(config.setAbsolutePaths(obj)).to.deep.eq(expected)

describe "lib/util/config", ->

  context ".isDefault", ->
    it "returns true if value is default value", ->
      settings = {baseUrl: null}
      defaults = {baseUrl: null}
      resolved = {}
      merged = config.setResolvedConfigValues(settings, defaults, resolved)
      expect(configUtil.isDefault(merged, "baseUrl")).to.be.true

    it "returns false if value is not default value", ->
      settings = {baseUrl: null}
      defaults = {baseUrl: "http://localhost:8080"}
      resolved = {}
      merged = config.setResolvedConfigValues(settings, defaults, resolved)
      expect(configUtil.isDefault(merged, "baseUrl")).to.be.false
