require("../spec_helper")

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
    it "sets projectPath", ->
      projectPath = path.resolve(cwd, "./foo/bar")
      options = @setup("--project", "./foo/bar")
      expect(options.projectPath).to.eq projectPath

  context "--run-project", ->
    it "sets projectPath", ->
      projectPath = path.resolve(cwd, "/baz")
      options = @setup("--run-project", "/baz")
      expect(options.projectPath).to.eq projectPath

    it "strips single double quote from the end", ->
      # https://github.com/cypress-io/cypress-monorepo/issues/535
      # NPM does not pass correctly options that end with backslash
      options = @setup("--run-project", "C:\\foo\"")
      expect(options.runProject).to.eq("C:\\foo")

    it "does not strip if there are multiple double quotes", ->
      options = @setup("--run-project", '"foo bar"')
      expect(options.runProject).to.eq('"foo bar"')

  context "--spec", ->
    it "converts to array", ->


  context "--port", ->
    it "converts to Number", ->
      options = @setup("--port", "8080")
      expect(options.port).to.eq(8080)

  context "--env", ->
    it "converts to object literal", ->
      options = @setup("--env", "foo=bar,version=0.12.1,host=localhost:8888,bar=qux=")
      expect(options.env).to.deep.eq({
        foo: "bar"
        version: "0.12.1"
        host: "localhost:8888"
        bar: "qux="
      })

  context "--config", ->
    it "converts to object literal", ->
      options = @setup("--config", "pageLoadTimeout=10000,waitForAnimations=false")

      expect(options.pageLoadTimeout).eq(10000)
      expect(options.waitForAnimations).eq(false)

    it "whitelists config properties", ->
      options = @setup("--config", "foo=bar,port=1111,supportFile=path/to/support_file")

      expect(options.port).to.eq(1111)
      expect(options.supportFile).to.eq("path/to/support_file")
      expect(options).not.to.have.property("foo")

    it "overrides existing flat options", ->
      options = @setup("--port", 2222, "--config", "port=3333")

      expect(options.port).to.eq(3333)

  context ".toArray", ->
    beforeEach ->
      @obj = {hosts: {"*.foobar.com": "127.0.0.1"}, _hosts: "*.foobar.com=127.0.0.1", project: "foo/bar"}

    it "rejects values which have an cooresponding underscore'd key", ->
      expect(argsUtil.toArray(@obj)).to.deep.eq(["--project=foo/bar", "--hosts=*.foobar.com=127.0.0.1"])

  context ".toObject", ->
    beforeEach ->
      ## make sure it works with both --env=foo=bar and --config foo=bar
      @obj = @setup(
        "--get-key",
        "--hosts=*.foobar.com=127.0.0.1",
        "--env=foo=bar,baz=quux,bar=foo=quz",
        "--config",
        "requestTimeout=1234,responseTimeout=9876"
        "--reporter-options=foo=bar"
        "--spec=foo,bar,baz",
      )

    it "coerces booleans", ->
      expect(@setup("--foo=true").foo).be.true
      expect(@setup("--no-record").record).to.be.false
      expect(@setup("--record=false").record).to.be.false

    it "backs up hosts, env, config, reporterOptions, spec", ->
      expect(@obj).to.deep.eq({
        cwd
        _: []
        "get-key": true
        getKey: true
        _hosts: "*.foobar.com=127.0.0.1"
        hosts: {"*.foobar.com": "127.0.0.1"}
        _env: "foo=bar,baz=quux,bar=foo=quz"
        env: {
          foo: "bar"
          baz: "quux"
          bar: "foo=quz"
        }
        config: {
          requestTimeout: 1234
          responseTimeout: 9876
        }
        _config: "requestTimeout=1234,responseTimeout=9876"
        requestTimeout: 1234
        responseTimeout: 9876
        "reporter-options": "foo=bar"
        _reporterOptions: "foo=bar"
        reporterOptions: {
          foo: "bar"
        }
        _spec: "foo,bar,baz"
        spec: [
          path.join(cwd, "foo"),
          path.join(cwd, "bar"),
          path.join(cwd, "baz")
        ]
      })

    it "can transpose back to an array", ->
      expect(argsUtil.toArray(@obj)).to.deep.eq([
        "--cwd=#{cwd}"
        "--getKey=true"
        "--spec=foo,bar,baz",
        "--config=requestTimeout=1234,responseTimeout=9876"
        "--hosts=*.foobar.com=127.0.0.1"
        "--env=foo=bar,baz=quux,bar=foo=quz"
        "--reporterOptions=foo=bar"
        "--requestTimeout=1234"
        "--responseTimeout=9876",
      ])

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
        appPath: "a"
        execPath: "e"
        "app-path": "a"
        "exec-path": "e"
        updating: true
      })
