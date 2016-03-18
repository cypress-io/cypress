require("../spec_helper")

path     = require("path")
argsUtil = require("#{root}lib/util/args")

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
      projectPath = path.resolve(process.cwd(), "./foo/bar")
      options = @setup("--project", "./foo/bar")
      expect(options.projectPath).to.eq projectPath

  context "--run-project", ->
    it "sets projectPath", ->
      projectPath = path.resolve(process.cwd(), "/baz")
      options = @setup("--run-project", "/baz")
      expect(options.projectPath).to.eq projectPath

  context "--coords", ->
    it "sets x and y", ->
      options = @setup("--coords=800x600")
      expect(options.coords).to.deep.eq({
        x: 800
        y: 600
      })

  context "--port", ->
    it "converts to Number", ->
      options = @setup("--port", "8080")
      expect(options.port).to.eq(8080)

  context "--env", ->
    it "converts to object literal", ->
      options = @setup("--env", "foo=bar,version=0.12.1,host=localhost:8888")
      expect(options.environmentVariables).to.deep.eq({
        foo: "bar"
        version: "0.12.1"
        host: "localhost:8888"
      })

  context ".toArray", ->
    beforeEach ->
      @obj = {coords: {x: 1, y: 2}, _coords: "1x2", project: "foo/bar"}

    it "rejects values which have an cooresponding underscore'd key", ->
      expect(argsUtil.toArray(@obj)).to.deep.eq(["--project=foo/bar", "--coords=1x2"])

  context ".toObject", ->
    beforeEach ->
      @obj = @setup("--get-key", "--coords=1x2", "--env=foo=bar,baz=quux")

    it "backs up coords + environmentVariables", ->
      expect(@obj).to.deep.eq({
        _: []
        env: process.env.NODE_ENV
        "get-key": true
        getKey: true
        _coords: "1x2"
        coords: {x: 1, y: 2}
        _environmentVariables: "foo=bar,baz=quux"
        environmentVariables: {
          foo: "bar"
          baz: "quux"
        }
      })

    it "can transpose back to an array", ->
      expect(argsUtil.toArray(@obj)).to.deep.eq([
        "--getKey=true", "--coords=1x2", "--environmentVariables=foo=bar,baz=quux"
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
        "--coords=1287x30"
      ]

      expect(argsUtil.toObject(argv)).to.deep.eq({
        _: [
          "/private/var/folders/wr/3xdzqnq16lz5r1j_xtl443580000gn/T/cypress/Cypress.app/Contents/MacOS/Cypress"
          "/Applications/Cypress.app"
          "/Applications/Cypress.app"
        ]
        env: process.env.NODE_ENV
        appPath: "/Applications/Cypress.app"
        execPath: "/Applications/Cypress.app"
        updating: true
        _coords: "1287x30"
        coords: {x: 1287, y: 30}
      })

    it "does not slurp up appPath + execPath if updating and these are already present in args", ->
      argv = [
        "/private/var/folders/wr/3xdzqnq16lz5r1j_xtl443580000gn/T/cypress/Cypress.app/Contents/MacOS/Cypress"
        "/Applications/Cypress.app1"
        "/Applications/Cypress.app2"
        "--app-path=a"
        "--exec-path=e"
        "--updating"
        "--coords=1287x30"
      ]

      expect(argsUtil.toObject(argv)).to.deep.eq({
        _: [
          "/private/var/folders/wr/3xdzqnq16lz5r1j_xtl443580000gn/T/cypress/Cypress.app/Contents/MacOS/Cypress"
          "/Applications/Cypress.app1"
          "/Applications/Cypress.app2"
        ]
        env: process.env.NODE_ENV
        appPath: "a"
        execPath: "e"
        "app-path": "a"
        "exec-path": "e"
        updating: true
        _coords: "1287x30"
        coords: {x: 1287, y: 30}
      })

