require("../spec_helper")

_        = require("lodash")
path     = require("path")
os       = require("os")
argsUtil = require("#{root}lib/util/args")
proxyUtil = require("#{root}lib/util/proxy")
getWindowsProxyUtil = require("#{root}lib/util/get-windows-proxy")

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
        invokedFromCli: false
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
        invokedFromCli: true
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
        invokedFromCli: false
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
        invokedFromCli: false
        updating: true
      })

  context "with proxy", ->
    beforeEach ->
      process.env = @originalEnv
      delete process.env.HTTP_PROXY
      delete process.env.HTTPS_PROXY
      delete process.env.NO_PROXY
      delete process.env.http_proxy
      delete process.env.https_proxy
      delete process.env.no_proxy

    it "sets options from environment", ->
      process.env.HTTP_PROXY = "http://foo-bar.baz:123"
      process.env.NO_PROXY = "a,b,c"
      options = @setup()
      expect(options.proxySource).to.be.undefined
      expect(options.proxyServer).to.eq process.env.HTTP_PROXY
      expect(options.proxyServer).to.eq "http://foo-bar.baz:123"
      expect(options.proxyBypassList).to.eq "a,b,c,127.0.0.1,::1,localhost"
      expect(process.env.HTTPS_PROXY).to.eq process.env.HTTP_PROXY

    it "loads from Windows registry if not defined", ->
      sinon.stub(getWindowsProxyUtil, "getWindowsProxy").returns({
        httpProxy: "http://quux.quuz",
        noProxy: "d,e,f"
      })
      sinon.stub(os, "platform").returns("win32")
      options = @setup()
      expect(options.proxySource).to.eq "win32"
      expect(options.proxyServer).to.eq "http://quux.quuz"
      expect(options.proxyServer).to.eq process.env.HTTP_PROXY
      expect(options.proxyServer).to.eq process.env.HTTPS_PROXY
      expect(options.proxyBypassList).to.eq "d,e,f,127.0.0.1,::1,localhost"
      expect(options.proxyBypassList).to.eq process.env.NO_PROXY

    ['', 'false', '0'].forEach (override) ->
      it "doesn't load from Windows registry if HTTP_PROXY overridden with string '#{override}'", ->
        sinon.stub(getWindowsProxyUtil, "getWindowsProxy").returns()
        sinon.stub(os, "platform").returns("win32")
        process.env.HTTP_PROXY = override
        options = @setup()
        expect(getWindowsProxyUtil.getWindowsProxy).to.not.beCalled
        expect(options.proxySource).to.be.undefined
        expect(options.proxyServer).to.be.undefined
        expect(options.proxyBypassList).to.be.undefined
        expect(process.env.HTTP_PROXY).to.be.undefined
        expect(process.env.HTTPS_PROXY).to.be.undefined
        expect(process.env.NO_PROXY).to.eq "127.0.0.1,::1,localhost"

    it "doesn't mess with env vars if Windows registry doesn't have proxy", ->
      sinon.stub(getWindowsProxyUtil, "getWindowsProxy").returns()
      sinon.stub(os, "platform").returns("win32")
      options = @setup()
      expect(options.proxySource).to.be.undefined
      expect(options.proxyServer).to.be.undefined
      expect(options.proxyBypassList).to.be.undefined
      expect(process.env.HTTP_PROXY).to.be.undefined
      expect(process.env.HTTPS_PROXY).to.be.undefined
      expect(process.env.NO_PROXY).to.eq "127.0.0.1,::1,localhost"

    it "sets a default NO_PROXY", ->
      process.env.HTTP_PROXY = "http://foo-bar.baz:123"
      options = @setup()
      expect(options.proxySource).to.be.undefined
      expect(options.proxyServer).to.eq process.env.HTTP_PROXY
      expect(options.proxyBypassList).to.eq "127.0.0.1,::1,localhost"
      expect(options.proxyBypassList).to.eq process.env.NO_PROXY

    it "does not add localhost to NO_PROXY if NO_PROXY contains <-loopback>", ->
      process.env.HTTP_PROXY = "http://foo-bar.baz:123"
      process.env.NO_PROXY = "a,b,c,<-loopback>,d"
      options = @setup()
      expect(options.proxySource).to.be.undefined
      expect(options.proxyServer).to.eq process.env.HTTP_PROXY
      expect(options.proxyBypassList).to.eq "a,b,c,<-loopback>,d"
      expect(options.proxyBypassList).to.eq process.env.NO_PROXY

    it "sets a default localhost NO_PROXY if NO_PROXY = ''", ->
      process.env.HTTP_PROXY = "http://foo-bar.baz:123"
      process.env.NO_PROXY = ""
      options = @setup()
      expect(options.proxySource).to.be.undefined
      expect(options.proxyServer).to.eq process.env.HTTP_PROXY
      expect(options.proxyBypassList).to.eq "127.0.0.1,::1,localhost"
      expect(options.proxyBypassList).to.eq process.env.NO_PROXY

    it "does not set a default localhost NO_PROXY if NO_PROXY = '<-loopback>'", ->
      process.env.HTTP_PROXY = "http://foo-bar.baz:123"
      process.env.NO_PROXY = "<-loopback>"
      options = @setup()
      expect(options.proxySource).to.be.undefined
      expect(options.proxyServer).to.eq process.env.HTTP_PROXY
      expect(options.proxyBypassList).to.eq "<-loopback>"
      expect(options.proxyBypassList).to.eq process.env.NO_PROXY

    it "copies lowercase proxy vars to uppercase", ->
      process.env.http_proxy = "http://foo-bar.baz:123"
      process.env.https_proxy = "https://foo-bar.baz:123"
      process.env.no_proxy = "http://no-proxy.holla"
      expect(process.env.HTTP_PROXY).to.be.undefined
      expect(process.env.HTTPS_PROXY).to.be.undefined
      expect(process.env.NO_PROXY).to.be.undefined

      options = @setup()

      expect(process.env.HTTP_PROXY).to.eq "http://foo-bar.baz:123"
      expect(process.env.HTTPS_PROXY).to.eq "https://foo-bar.baz:123"
      expect(process.env.NO_PROXY).to.eq "http://no-proxy.holla,127.0.0.1,::1,localhost"
      expect(options.proxySource).to.be.undefined
      expect(options.proxyServer).to.eq process.env.HTTP_PROXY
      expect(options.proxyBypassList).to.eq process.env.NO_PROXY

    it "can use npm_config_proxy", ->
      process.env.npm_config_proxy = "http://foo-bar.baz:123"
      expect(process.env.HTTP_PROXY).to.be.undefined

      options = @setup()

      expect(process.env.HTTP_PROXY).to.eq "http://foo-bar.baz:123"
      expect(process.env.HTTPS_PROXY).to.eq "http://foo-bar.baz:123"
      expect(process.env.NO_PROXY).to.eq "127.0.0.1,::1,localhost"
      expect(options.proxySource).to.be.undefined
      expect(options.proxyServer).to.eq process.env.HTTP_PROXY
      expect(options.proxyBypassList).to.eq process.env.NO_PROXY

    it "can override npm_config_proxy with falsy HTTP_PROXY", ->
      process.env.npm_config_proxy = "http://foo-bar.baz:123"
      process.env.HTTP_PROXY = ""

      options = @setup()

      expect(process.env.HTTP_PROXY).to.be.undefined
      expect(process.env.HTTPS_PROXY).to.be.undefined
      expect(process.env.NO_PROXY).to.eq "127.0.0.1,::1,localhost"
      expect(options.proxySource).to.be.undefined
      expect(options.proxyServer).to.eq process.env.HTTP_PROXY
      expect(options.proxyBypassList).to.be.undefined
