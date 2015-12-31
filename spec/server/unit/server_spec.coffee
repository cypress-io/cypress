require("../spec_helper")

Server        = require "#{root}lib/server"
Socket        = require "#{root}lib/socket"
Support       = require "#{root}lib/support"
Fixtures      = require "#{root}lib/fixtures"
Watchers      = require "#{root}lib/watchers"
Project       = require "#{root}lib/project"
Log           = require "#{root}lib/log"
Settings      = require "#{root}lib/util/settings"

describe "Server Interface", ->
  beforeEach ->
    @sandbox.stub(Socket.prototype, "startListening")
    @sandbox.stub(Project.prototype, "ensureProjectId").resolves("a-long-guid-123")
    @sandbox.stub(Project.prototype, "getDetails").resolves("a-long-guid-123")
    @sandbox.stub(Settings, "readSync").returns({})
    @sandbox.stub(Support.prototype, "scaffold").resolves({})
    @sandbox.stub(Fixtures.prototype, "scaffold").resolves({})
    @sandbox.stub(Watchers.prototype, "watch").returns()
    @server = Server("/Users/brian/app")

  afterEach ->
    @server?.close()

  it "sets config as a property", ->
    s = Server("/foo")
    expect(s.config).to.be.an("object")

  it "throws without a project root", ->
    fn = -> Server()
    expect(fn).to.throw "Instantiating lib/server requires a projectRoot!"

  it "sets settings on Log", ->
    expect(Log.getSettings()).to.eq(@server.config)

  context "#close", ->
    it "returns a promise", ->
      expect(@server.close()).to.be.instanceof Promise

    it "calls close on @server", ->
      @server.open().bind(@).then ->
        @server.close()

    it "isListening=false", ->
      @server.open().bind(@).then ->
        @server.close().bind(@).then ->
          expect(@server.isListening).to.be.false

    it "clears settings from Log", ->
      Log.setSettings({})
      @server.close().then ->
        expect(Log.getSettings()).to.be.undefined

    it "app fires close event", ->
      emit = @sandbox.spy @server.app, "emit"

      @server.open().bind(@).then ->
        @server.close().then ->
          expect(emit).to.be.calledWith "close"

  context "#open", ->
    it "creates http server"

    it "creates socket io"

    it "creates global app object"

    it "stores cypress.json config and yields it", ->
      @server.open().then (config) =>
        expect(@server.app.get("cypress")).to.deep.eq config

    it "returns a promise", ->
      expect(@server.open()).to.be.instanceof Promise

    it "isListening=true", ->
      @server.open().bind(@).then ->
        expect(@server.isListening).to.be.true

    it "calls Fixtures#scaffold", ->
      @server.open().bind(@).then ->
        expect(Fixtures::scaffold).to.be.calledOnce

    it "calls Support#scaffold", ->
      @server.open().bind(@).then ->
        expect(Support::scaffold).to.be.calledOnce

    it "calls project#getDetails", ->
      @server.open().bind(@).then ->
        expect(Project::getDetails).to.be.calledWith("a-long-guid-123")

    it "watches cypress.json", ->
      @server.open().bind(@).then ->
        expect(Watchers::watch).to.be.calledWith("/Users/brian/app/cypress.json")

    it "passes watchers to Socket.startListening", ->
      options = {}

      @server.open(options).then ->
        startListening = Socket::startListening
        expect(startListening.getCall(0).args[0]).to.be.instanceof(Watchers)
        expect(startListening.getCall(0).args[1]).to.eq(options)

    it "calls onReboot when cypress.json changes", ->
      onReboot = @sandbox.spy()

      ## invoke the onChange callback
      Watchers::watch.yieldsTo("onChange")

      @server.open({onReboot: onReboot}).then ->
        expect(onReboot).to.be.calledOnce

    it "calls close once on watchers + socket when app closes", ->
      close1 = @sandbox.stub(Watchers::, "close")
      close2 = @sandbox.stub(Socket::, "close")

      @server.open().then =>
        @server.app.emit("close")
        @server.app.emit("close")

        expect(close1).to.be.calledOnce
        expect(close2).to.be.calledOnce

    context "port", ->
      it "can override default port", ->
        @server.open({port: 8080}).then =>
          expect(@server.config.port).to.eq 8080
          expect(@server.app.get("cypress").port).to.eq 8080
          expect(@server.app.get("port")).to.eq 8080

      it "updates clientUrl", ->
        @server.open({port: 8080}).then =>
          expect(@server.config.clientUrl).to.eq "http://localhost:8080/__/"

      it "updates clientUrlDisplay", ->
        @server.open({port: 8080}).then =>
          expect(@server.config.clientUrlDisplay).to.eq "http://localhost:8080"

      it "upates idGeneratorUrl", ->
        @server.open({port: 8080}).then =>
          expect(@server.config.idGeneratorUrl).to.eq "http://localhost:8080/__cypress/id_generator"

    context "errors", ->
      afterEach ->
        Promise.all([
          fs.removeAsync("cypress.json")
          fs.removeAsync("cypress.env.json")
        ])

      it "rejects when parsing cypress.json fails", (done) ->
        Settings.readSync.restore()

        fs.writeFileSync("cypress.json", "{'foo': 'bar}")

        @server = Server(process.cwd())

        @server.open()
          .catch (err) ->
            expect(err.jsonError).to.be.true
            done()

      it "rejects when parsing cypress.env.json fails", (done) ->
        fs.writeFileSync("cypress.env.json", "{'foo;: 'bar}")

        @server = Server(process.cwd())

        @server.open()
          .catch (err) ->
            expect(err.jsonError).to.be.true
            done()

  context "#setCypressDefaults", ->
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

      config = @server.setCypressDefaults(obj)

      expect(config.environmentVariables).to.deep.eq({
        foo: "bar"
        bar: "baz"
        version: "1.0.1"
      })
      expect(config.env).to.eq(process.env["CYPRESS_ENV"])
      expect(config).not.to.have.property("envFile")

  context "#configureApplication", ->
    it "merges env into @config.env", ->
      @server.config = {
        environmentVariables: {
          host: "localhost"
          user: "brian"
          version: "0.12.2"
        }
      }

      @server.configureApplication({
        environmentVariables: {
          version: "0.13.1"
          foo: "bar"
        }
      })

      expect(@server.config.environmentVariables).to.deep.eq({
        host: "localhost"
        user: "brian"
        version: "0.13.1"
        foo: "bar"
      })

  context "#parseEnv", ->
    it "overrides env, envFromFile, processEnv, and static env", ->
      @sandbox.stub(@server, "getProcessEnvVars").returns({version: "0.12.1", user: "bob"})

      env1 = {
        version: "0.10.9"
        project: "todos"
        host: "localhost"
      }

      env2 = {
        host: "http://localhost:8888"
        user: "brian"
      }

      expect(@server.parseEnv(env1, env2)).to.deep.eq({
        version: "0.12.1"
        project: "todos"
        host: "http://localhost:8888"
        user: "bob"
      })

  context "#getProcessEnvVars", ->
    ["cypress_", "CYPRESS_"].forEach (key) ->

      it "reduces key: #{key}", ->
        obj = {
          cypress_host: "http://localhost:8888"
          foo: "bar"
          env: "123"
        }

        obj[key + "version"] = "0.12.0"

        expect(@server.getProcessEnvVars(obj)).to.deep.eq({
          host: "http://localhost:8888"
          version: "0.12.0"
        })

    it "does not merge CYPRESS_ENV", ->
      obj = {
        CYPRESS_ENV: "production"
        CYPRESS_FOO: "bar"
      }

      expect(@server.getProcessEnvVars(obj)).to.deep.eq({
        FOO: "bar"
      })

  context "#getCypressJson", ->
    describe "defaults", ->
      beforeEach ->
        @defaults = (prop, value, json = {}) =>

          Settings.readSync.returns(json)

          @server = Server("/Users/brian/app")

          expect(@server.config[prop]).to.deep.eq(value)

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

      it "idGeneratorUrl=http://localhost:2020/__cypress/id_generator", ->
        @defaults "idGeneratorUrl", "http://localhost:2020/__cypress/id_generator"

      it "baseUrl=http://localhost:8000/app", ->
        @defaults "baseUrl", "http://localhost:8000/app", {
          baseUrl: "http://localhost:8000/app//"
        }

      it "projectRoot=/Users/brian/app", ->
        @defaults "projectRoot", "/Users/brian/app"

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
