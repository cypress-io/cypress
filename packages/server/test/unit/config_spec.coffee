require("../spec_helper")

_        = require("lodash")
path     = require("path")
R        = require("ramda")
config      = require("#{root}lib/config")
errors      = require("#{root}lib/errors")
configUtil  = require("#{root}lib/util/config")
scaffold    = require("#{root}lib/scaffold")
settings    = require("#{root}lib/util/settings")

describe "lib/config", ->
  beforeEach ->
    @env = process.env

    process.env = _.omit(process.env, "CYPRESS_DEBUG")

  afterEach ->
    process.env = @env

  context "environment name check", ->
    it "throws an error for unknown CYPRESS_ENV", ->
      sinon.stub(errors, "throw").withArgs("INVALID_CYPRESS_ENV", "foo-bar")
      process.env.CYPRESS_ENV = "foo-bar"
      cfg = {
        projectRoot: "/foo/bar/"
      }
      options = {}
      config.mergeDefaults(cfg, options)
      expect(errors.throw).have.been.calledOnce

    it "allows known CYPRESS_ENV", ->
      sinon.stub(errors, "throw")
      process.env.CYPRESS_ENV = "test"
      cfg = {
        projectRoot: "/foo/bar/"
      }
      options = {}
      config.mergeDefaults(cfg, options)
      expect(errors.throw).not.to.be.called

  context ".get", ->
    beforeEach ->
      @projectRoot = "/_test-output/path/to/project"
      @setup = (cypressJson = {}, cypressEnvJson = {}) =>
        sinon.stub(settings, "read").withArgs(@projectRoot).resolves(cypressJson)
        sinon.stub(settings, "readEnv").withArgs(@projectRoot).resolves(cypressEnvJson)

    it "sets projectRoot", ->
      @setup({}, {foo: "bar"})
      config.get(@projectRoot)
      .then (obj) =>
        expect(obj.projectRoot).to.eq(@projectRoot)
        expect(obj.env).to.deep.eq({foo: "bar"})

    it "sets projectName", ->
      @setup({}, {foo: "bar"})
      config.get(@projectRoot)
      .then (obj) ->
        expect(obj.projectName).to.eq("project")

    context "port", ->
      beforeEach ->
        @setup({}, {foo: "bar"})

      it "can override default port", ->
        config.get(@projectRoot, {port: 8080})
        .then (obj) ->
          expect(obj.port).to.eq(8080)

      it "updates browserUrl", ->
        config.get(@projectRoot, {port: 8080})
        .then (obj) ->
          expect(obj.browserUrl).to.eq "http://localhost:8080/__/"

      it "updates proxyUrl", ->
        config.get(@projectRoot, {port: 8080})
        .then (obj) ->
          expect(obj.proxyUrl).to.eq "http://localhost:8080"

    context "validation", ->
      beforeEach ->
        @expectValidationPasses = =>
          config.get(@projectRoot) ## shouldn't throw

        @expectValidationFails = (errorMessage = "validation error") =>
          config.get(@projectRoot)
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
          @expectValidationFails("the value was: \`{\"foo\":\"bar\"}\`")

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
          @expectValidationFails("the value was: `42`")

      context "modifyObstructiveCode", ->
        it "passes if a boolean", ->
          @setup({modifyObstructiveCode: false})
          @expectValidationPasses()

        it "fails if not a boolean", ->
          @setup({modifyObstructiveCode: 42})
          @expectValidationFails("be a boolean")
          @expectValidationFails("the value was: `42`")

      context "defaultCommandTimeout", ->
        it "passes if a number", ->
          @setup({defaultCommandTimeout: 10})
          @expectValidationPasses()

        it "fails if not a number", ->
          @setup({defaultCommandTimeout: "foo"})
          @expectValidationFails("be a number")
          @expectValidationFails("the value was: `\"foo\"`")

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

      context "taskTimeout", ->
        it "passes if a number", ->
          @setup({taskTimeout: 10})
          @expectValidationPasses()

        it "fails if not a number", ->
          @setup({taskTimeout: "foo"})
          @expectValidationFails("be a number")

      context "fileServerFolder", ->
        it "passes if a string", ->
          @setup({fileServerFolder: "_files"})
          @expectValidationPasses()

        it "fails if not a string", ->
          @setup({fileServerFolder: true})
          @expectValidationFails("be a string")
          @expectValidationFails("the value was: `true`")

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
          @expectValidationFails("the value was: `[5]`")

      context "integrationFolder", ->
        it "passes if a string", ->
          @setup({integrationFolder: "_tests"})
          @expectValidationPasses()

        it "fails if not a string", ->
          @setup({integrationFolder: true})
          @expectValidationFails("be a string")

      context "userAgent", ->
        it "passes if a string", ->
          @setup({userAgent: "_tests"})
          @expectValidationPasses()

        it "fails if not a string", ->
          @setup({userAgent: true})
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

      context "pluginsFile", ->
        it "passes if a string", ->
          @setup({pluginsFile: "cypress/plugins"})
          @expectValidationPasses()

        it "passes if false", ->
          @setup({pluginsFile: false})
          @expectValidationPasses()

        it "fails if not a string or false", ->
          @setup({pluginsFile: 42})
          @expectValidationFails("be a string")

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

      context "testFiles", ->
        it "passes if a string", ->
          @setup({testFiles: "**/*.coffee"})
          @expectValidationPasses()

        it "fails if not a string", ->
          @setup({testFiles: 42})
          @expectValidationFails("be a string")

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

      context "trashAssetsBeforeRuns", ->
        it "passes if a boolean", ->
          @setup({trashAssetsBeforeRuns: false})
          @expectValidationPasses()

        it "fails if not a boolean", ->
          @setup({trashAssetsBeforeRuns: 42})
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

      context "video", ->
        it "passes if a boolean", ->
          @setup({video: false})
          @expectValidationPasses()

        it "fails if not a boolean", ->
          @setup({video: 42})
          @expectValidationFails("be a boolean")

      context "videoUploadOnPasses", ->
        it "passes if a boolean", ->
          @setup({videoUploadOnPasses: false})
          @expectValidationPasses()

        it "fails if not a boolean", ->
          @setup({videoUploadOnPasses: 99})
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

      context "blacklistHosts", ->
        it "passes if a string", ->
          @setup({blacklistHosts: "google.com"})
          @expectValidationPasses()

        it "passes if an array of strings", ->
          @setup({blacklistHosts: ["google.com"]})
          @expectValidationPasses()

        it "fails if not a string or array", ->
          @setup({blacklistHosts: 5})
          @expectValidationFails("be a string or an array of string")

        it "fails if not an array of strings", ->
          @setup({blacklistHosts: [5]})
          @expectValidationFails("be a string or an array of string")
          @expectValidationFails("the value was: `[5]`")

  context ".getConfigKeys", ->
    beforeEach ->
      @includes = (key) ->
        expect(config.getConfigKeys()).to.include(key)

    it "includes blacklistHosts", ->
      @includes("blacklistHosts")

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
        config.mergeDefaults(cfg, options)
        .then R.prop(prop)
        .then (result) ->
          expect(result).to.deep.eq(value)

    it "port=null", ->
      @defaults "port", null

    it "projectId=null", ->
      @defaults("projectId", null)

    it "autoOpen=false", ->
      @defaults "autoOpen", false

    it "browserUrl=http://localhost:2020/__/", ->
      @defaults "browserUrl", "http://localhost:2020/__/", {port: 2020}

    it "proxyUrl=http://localhost:2020", ->
      @defaults "proxyUrl", "http://localhost:2020", {port: 2020}

    it "namespace=__cypress", ->
      @defaults "namespace", "__cypress"

    it "baseUrl=http://localhost:8000/app/", ->
      @defaults "baseUrl", "http://localhost:8000/app/", {
        baseUrl: "http://localhost:8000/app///"
      }

    it "baseUrl=http://localhost:8000/app/", ->
      @defaults "baseUrl", "http://localhost:8000/app/", {
        baseUrl: "http://localhost:8000/app//"
      }

    it "baseUrl=http://localhost:8000/app", ->
      @defaults "baseUrl", "http://localhost:8000/app", {
        baseUrl: "http://localhost:8000/app"
      }

    it "baseUrl=http://localhost:8000/", ->
      @defaults "baseUrl", "http://localhost:8000/", {
        baseUrl: "http://localhost:8000//"
      }

    it "baseUrl=http://localhost:8000/", ->
      @defaults "baseUrl", "http://localhost:8000/", {
        baseUrl: "http://localhost:8000/"
      }

    it "baseUrl=http://localhost:8000", ->
      @defaults "baseUrl", "http://localhost:8000", {
        baseUrl: "http://localhost:8000"
      }

    it "javascripts=[]", ->
      @defaults "javascripts", []

    it "viewportWidth=1000", ->
      @defaults "viewportWidth", 1000

    it "viewportHeight=660", ->
      @defaults "viewportHeight", 660

    it "userAgent=null", ->
      @defaults("userAgent", null)

    it "baseUrl=null", ->
      @defaults "baseUrl", null

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

    it "video=true", ->
      @defaults "video", true

    it "videoCompression=32", ->
      @defaults "videoCompression", 32

    it "videoUploadOnPasses=true", ->
      @defaults "videoUploadOnPasses", true

    it "trashAssetsBeforeRuns=32", ->
      @defaults "trashAssetsBeforeRuns", true

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

    it "modifyObstructiveCode=true", ->
      @defaults "modifyObstructiveCode", true

    it "supportFile=false", ->
      @defaults "supportFile", false, {supportFile: false}

    it "blacklistHosts=null", ->
      @defaults("blacklistHosts", null)

    it "blacklistHosts=[a,b]", ->
      @defaults("blacklistHosts", ["a", "b"], {
        blacklistHosts: ["a", "b"]
      })

    it "blacklistHosts=a|b", ->
      @defaults("blacklistHosts", ["a", "b"], {
        blacklistHosts: ["a", "b"]
      })

    it "hosts=null", ->
      @defaults("hosts", null)

    it "hosts={}", ->
      @defaults("hosts", {
        foo: "bar"
        baz: "quux"
      }, {
        hosts: {
          foo: "bar",
          baz: "quux"
        }
      })

    it "resets numTestsKeptInMemory to 0 when runMode", ->
      config.mergeDefaults({projectRoot: "/foo/bar/"}, {isTextTerminal: true})
      .then (cfg) ->
        expect(cfg.numTestsKeptInMemory).to.eq(0)

    it "resets watchForFileChanges to false when runMode", ->
      config.mergeDefaults({projectRoot: "/foo/bar/"}, {isTextTerminal: true})
      .then (cfg) ->
        expect(cfg.watchForFileChanges).to.be.false

    it "can override morgan in options", ->
      config.mergeDefaults({projectRoot: "/foo/bar/"}, {morgan: false})
      .then (cfg) ->
        expect(cfg.morgan).to.be.false

    it "can override isTextTerminal in options", ->
      config.mergeDefaults({projectRoot: "/foo/bar/"}, {isTextTerminal: true})
      .then (cfg) ->
        expect(cfg.isTextTerminal).to.be.true

    it "can override socketId in options", ->
      config.mergeDefaults({projectRoot: "/foo/bar/"}, {socketId: 1234})
      .then (cfg) ->
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

      config.mergeDefaults(obj)
      .then (cfg) ->
        expect(cfg.env).to.deep.eq({
          foo: "bar"
          bar: "baz"
          version: "1.0.1"
        })
        expect(cfg.cypressEnv).to.eq(process.env["CYPRESS_ENV"])
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
        env: {
          version: "0.13.1"
          foo: "bar"
        }
      }

      config.mergeDefaults(obj, options)
      .then (cfg) ->
        expect(cfg.env).to.deep.eq({
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

        config.mergeDefaults(obj, options)
        .then (cfg) ->
          expect(cfg.resolved).to.deep.eq({
            env:                        { }
            projectId:                  { value: null, from: "default" },
            port:                       { value: 1234, from: "cli" },
            hosts:                      { value: null, from: "default" }
            blacklistHosts:             { value: null, from: "default" }
            userAgent:                  { value: null, from: "default" }
            reporter:                   { value: "json", from: "cli" },
            reporterOptions:            { value: null, from: "default" },
            baseUrl:                    { value: null, from: "default" },
            defaultCommandTimeout:      { value: 4000, from: "default" },
            pageLoadTimeout:            { value: 60000, from: "default" },
            requestTimeout:             { value: 5000, from: "default" },
            responseTimeout:            { value: 30000, from: "default" },
            execTimeout:                { value: 60000, from: "default" },
            taskTimeout:                { value: 60000, from: "default" },
            numTestsKeptInMemory:       { value: 50, from: "default" },
            waitForAnimations:          { value: true, from: "default" },
            animationDistanceThreshold: { value: 5, from: "default" },
            trashAssetsBeforeRuns:      { value: true, from: "default" },
            watchForFileChanges:        { value: true, from: "default" },
            modifyObstructiveCode:      { value: true, from: "default" },
            chromeWebSecurity:          { value: true, from: "default" },
            viewportWidth:              { value: 1000, from: "default" },
            viewportHeight:             { value: 660, from: "default" },
            fileServerFolder:           { value: "", from: "default" },
            video:                      { value: true, from: "default" }
            videoCompression:           { value: 32, from: "default" }
            videoUploadOnPasses:        { value: true, from: "default" }
            videosFolder:               { value: "cypress/videos", from: "default" },
            supportFile:                { value: "cypress/support", from: "default" },
            pluginsFile:                { value: "cypress/plugins", from: "default" },
            fixturesFolder:             { value: "cypress/fixtures", from: "default" },
            ignoreTestFiles:            { value: "*.hot-update.js", from: "default" },
            integrationFolder:          { value: "cypress/integration", from: "default" },
            screenshotsFolder:          { value: "cypress/screenshots", from: "default" },
            testFiles:                  { value: "**/*.*", from: "default" }
          })

      it "sets config, envFile and env", ->
        sinon.stub(config, "getProcessEnvVars").returns({
          quux: "quux"
          RECORD_KEY: "foobarbazquux",
          CI_KEY: "justanothercikey",
          PROJECT_ID: "projectId123"
        })

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
        }

        options = {
          env: {
            baz: "baz"
          }
        }

        config.mergeDefaults(obj, options)
        .then (cfg) ->
          expect(cfg.resolved).to.deep.eq({
            projectId:                  { value: "projectId123", from: "env" },
            port:                       { value: 2020, from: "config" },
            hosts:                      { value: null, from: "default" }
            blacklistHosts:             { value: null, from: "default" }
            userAgent:                  { value: null, from: "default" }
            reporter:                   { value: "spec", from: "default" },
            reporterOptions:            { value: null, from: "default" },
            baseUrl:                    { value: "http://localhost:8080", from: "config" },
            defaultCommandTimeout:      { value: 4000, from: "default" },
            pageLoadTimeout:            { value: 60000, from: "default" },
            requestTimeout:             { value: 5000, from: "default" },
            responseTimeout:            { value: 30000, from: "default" },
            execTimeout:                { value: 60000, from: "default" },
            taskTimeout:                { value: 60000, from: "default" },
            numTestsKeptInMemory:       { value: 50, from: "default" },
            waitForAnimations:          { value: true, from: "default" },
            animationDistanceThreshold: { value: 5, from: "default" },
            trashAssetsBeforeRuns:      { value: true, from: "default" },
            watchForFileChanges:        { value: true, from: "default" },
            modifyObstructiveCode:      { value: true, from: "default" },
            chromeWebSecurity:          { value: true, from: "default" },
            viewportWidth:              { value: 1000, from: "default" },
            viewportHeight:             { value: 660, from: "default" },
            fileServerFolder:           { value: "", from: "default" },
            video:                      { value: true, from: "default" }
            videoCompression:           { value: 32, from: "default" }
            videoUploadOnPasses:        { value: true, from: "default" }
            videosFolder:               { value: "cypress/videos", from: "default" },
            supportFile:                { value: "cypress/support", from: "default" },
            pluginsFile:                { value: "cypress/plugins", from: "default" },
            fixturesFolder:             { value: "cypress/fixtures", from: "default" },
            ignoreTestFiles:            { value: "*.hot-update.js", from: "default" },
            integrationFolder:          { value: "cypress/integration", from: "default" },
            screenshotsFolder:          { value: "cypress/screenshots", from: "default" },
            testFiles:                  { value: "**/*.*", from: "default" }
            env: {
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
              RECORD_KEY: {
                value: "fooba...zquux",
                from: "env"
              }
              CI_KEY: {
                value: "justa...cikey",
                from: "env"
              }
            }
          })

  context ".updateWithPluginValues", ->
    it "is noop when no overrides", ->
      expect(config.updateWithPluginValues({foo: 'bar'}, null)).to.deep.eq({
        foo: 'bar'
      })

    it "updates resolved config values and returns config with overrides", ->
      cfg = {
        foo: "bar"
        baz: "quux"
        quux: "foo"
        lol: 1234
        env: {
          a: "a"
          b: "b"
        }
        resolved: {
          foo: { value: "bar", from: "default" }
          baz: { value: "quux", from: "cli" }
          quux: { value: "foo", from: "default" }
          lol: { value: 1234,  from: "env" }
          env: {
            a: { value: "a", from: "config" }
            b: { value: "b", from: "config" }
          }
        }
      }

      overrides = {
        baz: "baz"
        quux: ["bar", "quux"]
        env: {
          b: "bb"
          c: "c"
        }
      }

      expect(config.updateWithPluginValues(cfg, overrides)).to.deep.eq({
        foo: "bar"
        baz: "baz"
        lol: 1234
        quux: ["bar", "quux"]
        env: {
          a: "a"
          b: "bb"
          c: "c"
        }
        resolved: {
          foo: { value: "bar", from: "default" }
          baz: { value: "baz", from: "plugin" }
          quux: { value: ["bar", "quux"], from: "plugin" }
          lol: { value: 1234,  from: "env" }
          env: {
            a: { value: "a", from: "config" }
            b: { value: "bb", from: "plugin" }
            c: { value: "c", from: "plugin" }
          }
        }
      })

  context ".parseEnv", ->
    it "merges together env from config, env from file, env from process, and env from CLI", ->
      sinon.stub(config, "getProcessEnvVars").returns({
        version: "0.12.1",
        user: "bob",
      })

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
      }

      envCLI = {
        version: "0.14.0"
        project: "pie"
      }

      expect(config.parseEnv(obj, envCLI)).to.deep.eq({
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

    it "does not merge reserved environment variables", ->
      obj = {
        CYPRESS_ENV: "production"
        CYPRESS_FOO: "bar"
        CYPRESS_CRASH_REPORTS: "0"
        CYPRESS_PROJECT_ID: "abc123"
      }

      expect(config.getProcessEnvVars(obj)).to.deep.eq({
        FOO: "bar"
        PROJECT_ID: "abc123"
        CRASH_REPORTS: 0
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
    it "sets integrationExamplePath + integrationExampleName + scaffoldedFiles", ->
      obj = {
        integrationFolder: "/_test-output/path/to/project/cypress/integration"
      }
      sinon.stub(scaffold, "fileTree").resolves([])

      config.setScaffoldPaths(obj).then (result) ->
        expect(result).to.deep.eq({
          integrationFolder: "/_test-output/path/to/project/cypress/integration"
          integrationExamplePath: "/_test-output/path/to/project/cypress/integration/examples"
          integrationExampleName: "examples"
          scaffoldedFiles: []
        })

  context ".setSupportFileAndFolder", ->
    it "does nothing if supportFile is falsey", ->
      obj = {
        projectRoot: "/_test-output/path/to/project"
      }
      config.setSupportFileAndFolder(obj)
      .then (result) ->
        expect(result).to.eql(obj)

    it "sets the full path to the supportFile and supportFolder if it exists", ->
      projectRoot = process.cwd()

      obj = config.setAbsolutePaths({
        projectRoot: projectRoot
        supportFile: "test/unit/config_spec.coffee"
      })

      config.setSupportFileAndFolder(obj)
      .then (result) ->
        expect(result).to.eql({
          projectRoot: projectRoot
          supportFile: "#{projectRoot}/test/unit/config_spec.coffee"
          supportFolder: "#{projectRoot}/test/unit"
        })

    it "sets the supportFile to default index.js if it does not exist, support folder does not exist, and supportFile is the default", ->
      projectRoot = path.join(process.cwd(), "test/support/fixtures/projects/no-scaffolding")

      obj = config.setAbsolutePaths({
        projectRoot: projectRoot
        supportFile: "cypress/support"
      })

      config.setSupportFileAndFolder(obj)
      .then (result) ->
        expect(result).to.eql({
          projectRoot: projectRoot
          supportFile: "#{projectRoot}/cypress/support/index.js"
          supportFolder: "#{projectRoot}/cypress/support"
        })

    it "sets the supportFile to false if it does not exist, support folder exists, and supportFile is the default", ->
      projectRoot = path.join(process.cwd(), "test/support/fixtures/projects/empty-folders")

      obj = config.setAbsolutePaths({
        projectRoot: projectRoot
        supportFile: "cypress/support"
      })

      config.setSupportFileAndFolder(obj)
      .then (result) ->
        expect(result).to.eql({
          projectRoot: projectRoot
          supportFile: false
        })

    it "throws error if supportFile is not default and does not exist", ->
      projectRoot = process.cwd()

      obj = config.setAbsolutePaths({
        projectRoot: projectRoot
        supportFile: "does/not/exist"
      })

      config.setSupportFileAndFolder(obj)
      .catch (err) ->
        expect(err.message).to.include("The support file is missing or invalid.")

  context ".setPluginsFile", ->
    it "does nothing if pluginsFile is falsey", ->
      obj = {
        projectRoot: "/_test-output/path/to/project"
      }
      config.setPluginsFile(obj)
      .then (result) ->
        expect(result).to.eql(obj)

    it "sets the pluginsFile to default index.js if does not exist", ->
      projectRoot = path.join(process.cwd(), "test/support/fixtures/projects/no-scaffolding")

      obj = {
        projectRoot: projectRoot
        pluginsFile: "#{projectRoot}/cypress/plugins"
      }

      config.setPluginsFile(obj)
      .then (result) ->
        expect(result).to.eql({
          projectRoot: projectRoot
          pluginsFile: "#{projectRoot}/cypress/plugins/index.js"
        })

    it "set the pluginsFile to false if it does not exist, plugins folder exists, and pluginsFile is the default", ->
      projectRoot = path.join(process.cwd(), "test/support/fixtures/projects/empty-folders")

      obj = config.setAbsolutePaths({
        projectRoot: projectRoot
        pluginsFile: "#{projectRoot}/cypress/plugins"
      })

      config.setPluginsFile(obj)
      .then (result) ->
        expect(result).to.eql({
          projectRoot: projectRoot
          pluginsFile: false
        })

    it "throws error if pluginsFile is not default and does not exist", ->
      projectRoot = process.cwd()

      obj = {
        projectRoot: projectRoot
        pluginsFile: "does/not/exist"
      }

      config.setPluginsFile(obj)
      .catch (err) ->
        expect(err.message).to.include("The plugins file is missing or invalid.")

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

    ["fileServerFolder", "fixturesFolder", "integrationFolder", "unitFolder", "supportFile", "pluginsFile"].forEach (folder) ->

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
