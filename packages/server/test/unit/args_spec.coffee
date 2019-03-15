require("../spec_helper")

_        = require("lodash")
path     = require("path")
argsUtil = require("#{root}lib/util/args")

cwd = process.cwd()

describe "lib/util/args", ->
  beforeEach ->
    @setup = (args...) ->
      argsUtil.toObject(args)

  context "--smoke-test", ->
    it "sets pong to ping", ->
      options = @setup("--smoke-test", "--ping=123")
      expect(options.pong).to.eq 123

  context "--project", ->
    it "sets projectRoot", ->
      projectRoot = path.resolve(cwd, "./foo/bar")
      options = @setup("--project", "./foo/bar")
      expect(options.projectRoot).to.eq projectRoot

  context "--run-project", ->
    it "sets projectRoot", ->
      projectRoot = path.resolve(cwd, "/baz")
      options = @setup("--run-project", "/baz")
      expect(options.projectRoot).to.eq projectRoot

    it "strips single double quote from the end", ->
      # https://github.com/cypress-io/cypress/issues/535
      # NPM does not pass correctly options that end with backslash
      options = @setup("--run-project", "C:\\foo\"")
      expect(options.runProject).to.eq("C:\\foo")

    it "does not strip if there are multiple double quotes", ->
      options = @setup("--run-project", '"foo bar"')
      expect(options.runProject).to.eq('"foo bar"')

  context "--spec", ->
    it "converts to array", ->
      options = @setup("--run-project", "foo", "--spec", "cypress/integration/a.js,cypress/integration/b.js,cypress/integration/c.js")
      expect(options.spec[0]).to.eq("#{cwd}/cypress/integration/a.js")
      expect(options.spec[1]).to.eq("#{cwd}/cypress/integration/b.js")
      expect(options.spec[2]).to.eq("#{cwd}/cypress/integration/c.js")

    it "discards wrapping single quotes", ->
      options = @setup("--run-project", "foo", "--spec", "'cypress/integration/foo_spec.js'")
      expect(options.spec[0]).to.eq("#{cwd}/cypress/integration/foo_spec.js")


  context "--port", ->
    it "converts to Number", ->
      options = @setup("--port", "8080")
      expect(options.config.port).to.eq(8080)

  context "--env", ->
    it "converts to object literal", ->
      options = @setup("--env", "foo=bar,version=0.12.1,host=localhost:8888,bar=qux=")
      expect(options.config.env).to.deep.eq({
        foo: "bar"
        version: "0.12.1"
        host: "localhost:8888"
        bar: "qux="
      })

  context "--reporterOptions", ->
    it "converts to object literal", ->
      reporterOpts = {
        mochaFile: "path/to/results.xml",
        testCaseSwitchClassnameAndName: true,
        suiteTitleSeparatedBy: ".=|"
      }

      options = @setup("--reporterOptions", JSON.stringify(reporterOpts))

      expect(options.config.reporterOptions).to.deep.eq(reporterOpts)

    it "converts nested objects with mixed assignment usage", ->
      reporterOpts = {
        reporterEnabled: 'JSON, Spec',
        jsonReporterOptions: {
          toConsole: true
        }
      }

      ## as a full blown object
      options = @setup("--reporterOptions", JSON.stringify(reporterOpts))
      expect(options.config.reporterOptions).to.deep.eq(reporterOpts)

      ## as mixed usage
      nestedJSON = JSON.stringify(reporterOpts.jsonReporterOptions)

      options = @setup(
        "--reporterOptions",
        "reporterEnabled=JSON,jsonReporterOptions=#{nestedJSON}"
      )
      expect(options.config.reporterOptions).to.deep.eq({
        reporterEnabled: 'JSON',
        jsonReporterOptions: {
          toConsole: true
        }
      })

  context "--config", ->
    it "converts to object literal", ->
      options = @setup("--config", "pageLoadTimeout=10000,waitForAnimations=false")

      expect(options.config.pageLoadTimeout).eq(10000)
      expect(options.config.waitForAnimations).eq(false)

    it "converts straight JSON stringification", ->
      config = {
        pageLoadTimeout: 10000,
        waitForAnimations: false
      }

      options = @setup("--config", JSON.stringify(config))
      expect(options.config).to.deep.eq(config)

    it "converts nested usage with JSON stringification", ->
      config = {
        pageLoadTimeout: 10000,
        waitForAnimations: false,
        blacklistHosts: ["one.com", "www.two.io"],
        hosts: {
          "foobar.com": "127.0.0.1",
        }
      }

      ## as a full blown object
      options = @setup("--config", JSON.stringify(config))
      expect(options.config).to.deep.eq(config)

      ## as mixed usage
      hosts = JSON.stringify(config.hosts)
      blacklistHosts = JSON.stringify(config.blacklistHosts)

      options = @setup(
        "--config",
        [
          "pageLoadTimeout=10000",
          "waitForAnimations=false",
          "hosts=#{hosts}",
          "blacklistHosts=#{blacklistHosts}",
        ].join(",")

      )
      expect(options.config).to.deep.eq(config)

    it "whitelists config properties", ->
      options = @setup("--config", "foo=bar,port=1111,supportFile=path/to/support_file")

      expect(options.config.port).to.eq(1111)
      expect(options.config.supportFile).to.eq("path/to/support_file")
      expect(options).not.to.have.property("foo")

    it "overrides port in config", ->
      options = @setup("--port", 2222, "--config", "port=3333")
      expect(options.config.port).to.eq(2222)

      options = @setup("--port", 2222)
      expect(options.config.port).to.eq(2222)

  context ".toArray", ->
    beforeEach ->
      @obj = {config: {foo: "bar"}, project: "foo/bar"}

    it "rejects values which have an cooresponding underscore'd key", ->
      expect(argsUtil.toArray(@obj)).to.deep.eq([
        "--project=foo/bar",
        "--config=#{JSON.stringify({foo: 'bar'})}"
      ])

  context ".toObject", ->
    beforeEach ->
      @hosts = { a: "b", b: "c" }
      @blacklistHosts = ["a.com", "b.com"]
      @specs = [
        path.join(cwd, "foo"),
        path.join(cwd, "bar"),
        path.join(cwd, "baz")
      ]
      @env = {
        foo: "bar"
        baz: "quux"
        bar: "foo=quz"
      }
      @config = {
        env: @env
        hosts: @hosts
        requestTimeout: 1234
        blacklistHosts: @blacklistHosts
        reporterOptions: {
          foo: "bar"
        }
      }

      s = (str) ->
        JSON.stringify(str)

      ## make sure it works with both --env=foo=bar and --config foo=bar
      @obj = @setup(
        "--get-key",
        "--env=foo=bar,baz=quux,bar=foo=quz",
        "--config",
        "requestTimeout=1234,blacklistHosts=#{s(@blacklistHosts)},hosts=#{s(@hosts)}"
        "--reporter-options=foo=bar"
        "--spec=foo,bar,baz",
      )

    it "coerces booleans", ->
      expect(@setup("--foo=true").foo).be.true
      expect(@setup("--no-record").record).to.be.false
      expect(@setup("--record=false").record).to.be.false

    it "backs up env, config, reporterOptions, spec", ->
      expect(@obj).to.deep.eq({
        cwd
        _: []
        getKey: true
        config: @config
        spec: @specs
      })

    it "can transpose back to an array", ->
      mergedConfig = JSON.stringify({
        requestTimeout: @config.requestTimeout
        blacklistHosts: @blacklistHosts
        hosts: @hosts
        env: @env
        reporterOptions: {
          foo: "bar"
        }
      })

      args = argsUtil.toArray(@obj)

      expect(args).to.deep.eq([
        "--cwd=#{cwd}"
        "--getKey=true"
        "--spec=#{JSON.stringify(@specs)}",
        "--config=#{mergedConfig}"
      ])

      expect(argsUtil.toObject(args)).to.deep.eq({
        cwd
        _: []
        getKey: true
        config: @config
        spec: @specs
      })

  context "--updating", ->

    ## updating from 0.13.9 will omit the appPath + execPath so we must
    ## handle these missing arguments manually
    it "slurps up appPath + execPath if updating and these are omitted", ->
      argv = [
        "/private/var/folders/wr/3xdzqnq16lz5r1j_xtl443580000gn/T/cypress/Cypress.app/Contents/MacOS/Cypress"
        "/Applications/Cypress.app"
        "/Applications/Cypress.app"
        "--updating"
      ]

      expect(argsUtil.toObject(argv)).to.deep.eq({
        cwd
        _: [
          "/private/var/folders/wr/3xdzqnq16lz5r1j_xtl443580000gn/T/cypress/Cypress.app/Contents/MacOS/Cypress"
          "/Applications/Cypress.app"
          "/Applications/Cypress.app"
        ]
        config: {}
        appPath: "/Applications/Cypress.app"
        execPath: "/Applications/Cypress.app"
        updating: true
      })

    it "does not slurp up appPath + execPath if updating and these are already present in args", ->
      argv = [
        "/private/var/folders/wr/3xdzqnq16lz5r1j_xtl443580000gn/T/cypress/Cypress.app/Contents/MacOS/Cypress"
        "/Applications/Cypress.app1"
        "/Applications/Cypress.app2"
        "--app-path=a"
        "--exec-path=e"
        "--updating"
      ]

      expect(argsUtil.toObject(argv)).to.deep.eq({
        cwd
        _: [
          "/private/var/folders/wr/3xdzqnq16lz5r1j_xtl443580000gn/T/cypress/Cypress.app/Contents/MacOS/Cypress"
          "/Applications/Cypress.app1"
          "/Applications/Cypress.app2"
        ]
        config: {}
        appPath: "a"
        execPath: "e"
        updating: true
      })
