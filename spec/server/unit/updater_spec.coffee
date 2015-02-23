## must stub due to node-webkit-updater requiring NW
global.window = {
  nwDispatcher: {
    requireNwGui: ->
  }
}

root        = '../../../'
expect      = require('chai').expect
fs          = require "fs-extra"
Updater     = require "#{root}lib/updater"
Fixtures    = require "#{root}/spec/server/helpers/fixtures"
mock        = require "mock-fs"
nock        = require 'nock'
sinon       = require "sinon"

describe "Updater", ->
  beforeEach ->
    @sandbox = sinon.sandbox.create()
    nock.disableNetConnect()

  afterEach ->
    @sandbox.restore()
    mock.restore()
    nock.enableNetConnect()
    nock.cleanAll()

  context "interface", ->
    it "returns an updater instance", ->
      u = Updater({})
      expect(u).to.be.instanceof Updater

    it "requires an App", ->
      fn = -> Updater()
      expect(fn).to.throw "Instantiating lib/updater requires an App!"

    it "stores App", ->
      u = Updater({})
      expect(u.App).to.deep.eq {}

  context "#getPackage", ->
    beforeEach ->
      mock({
        "package.json": JSON.stringify(foo: "bar")
      })

      @updater = Updater({})

    it "inserts manifestUrl to package.json", ->
      expect(@updater.getPackage()).to.deep.eq {
        foo: "bar"
        manifestUrl: "https://s3.amazonaws.com/dist.cypress.io/manifest.json"
      }

  context "#getClient", ->
    it "sets .client to new Updater", ->
      u = Updater({})
      u.getClient()
      expect(u.client).to.have.property("checkNewVersion")

    it "returns .client if exists", ->
      u = Updater({})
      client  = u.getClient()
      client2 = u.getClient()
      expect(client).to.eq(client2)

  context "#run", ->
    beforeEach ->
      @updater = Updater({quit: @sandbox.spy()})
      @updater.getClient()
      @checkNewVersion = @sandbox.stub(@updater.client, "checkNewVersion")

    it "invokes onRun", ->
      spy = @sandbox.spy()
      @updater.run({onStart: spy})
      expect(spy).to.be.called

    describe "client#checkNewVersion", ->
      beforeEach ->
        @download = @sandbox.stub(@updater, "download")

      it "is called once", ->
        @updater.run()
        expect(@checkNewVersion).to.be.calledOnce

      it "calls #download if new version exists", ->
        @checkNewVersion.callsArgWith(0, null, true, {})
        @updater.run()
        expect(@download).to.be.calledOnce

      it "passes manifest to #download when new version exists", ->
        @checkNewVersion.callsArgWith(0, null, true, {foo: "bar"})
        @updater.run()
        expect(@download).to.be.calledWith({foo: "bar"})

      it "does not call #download if there isnt a new version", ->
        @checkNewVersion.callsArgWith(0, null, false, {foo: "bar"})
        @updater.run()
        expect(@download).not.to.be.called

      it "invokes onNone when there isnt a new version", ->
        spy = @sandbox.spy()
        @checkNewVersion.callsArgWith(0, null, false)
        @updater.run({onNone: spy})
        expect(spy).to.be.called

      it "does not call #download if there is an error", ->
        @checkNewVersion.callsArgWith(0, (new Error), true, {foo: "bar"})
        @updater.run()
        expect(@download).not.to.be.called

      it "invokes onError callbacks", ->
        err = new Error("checking onError")
        spy = @sandbox.spy()
        @checkNewVersion.callsArgWith(0, err)
        @updater.run({onError: spy})
        expect(spy).to.be.calledWith(err)

    describe "#download", ->
      beforeEach ->
        @sandbox.stub(@updater.client, "download")
        @sandbox.stub(@updater, "unpack")
        @clock = @sandbox.useFakeTimers()

      it "invokes onDownload", ->
        spy = @sandbox.spy()
        @updater.callbacks.onDownload = spy
        @updater.download({})
        @clock.tick(1000)
        expect(spy).to.be.called

      it "calls unpack with destinationPath and manifest", ->
        @updater.client.download.callsArgWith(0, null, "/Users/bmann/app")
        @updater.download({})
        @clock.tick(1000)
        expect(@updater.unpack).to.be.calledOnce.and.to.be.calledWith("/Users/bmann/app", {})

      it "does not call unpack on error", ->
        @updater.client.download.callsArgWith(0, (new Error), "/Users/bmann/app")
        @updater.download({})
        @clock.tick(1000)
        expect(@updater.unpack).not.to.be.called

      it "invokes onError callbacks", ->
        err = new Error("checking onError")
        spy = @sandbox.spy()
        @updater.callbacks.onError = spy
        @updater.client.download.callsArgWith(0, err)
        @updater.download({})
        @clock.tick(1000)
        expect(spy).to.be.calledWith(err)

    describe "#unpack", ->
      beforeEach ->
        @sandbox.stub(@updater.client, "unpack")
        @sandbox.stub(@updater, "runInstaller")

      it "invokes onApply", ->
        spy = @sandbox.spy()
        @updater.callbacks.onApply = spy
        @updater.unpack("/some/path", {})
        expect(spy).to.be.called

      it "calls runInstaller with newAppPath", ->
        @updater.client.unpack.callsArgWith(1, null, "/Users/bmann/app")
        @updater.unpack("/some/path", {})
        expect(@updater.runInstaller).to.be.calledOnce.and.to.be.calledWith("/Users/bmann/app")

      it "does not call runInstaller on error", ->
        @updater.client.unpack.callsArgWith(1, (new Error), "/Users/bmann/app")
        @updater.unpack("/some/path", {})
        expect(@updater.runInstaller).not.to.be.called

      it "invokes onError callbacks", ->
        err = new Error("checking onError")
        spy = @sandbox.spy()
        @updater.callbacks.onError = spy
        @updater.client.unpack.callsArgWith(1, err)
        @updater.unpack("/some/path", {})
        expect(spy).to.be.calledWith(err)

    describe "#runInstaller", ->
      beforeEach ->
        @sandbox.stub(@updater.client, "runInstaller")

      it "calls quit on the App", ->
        @updater.runInstaller("/Users/bmann/newApp")
        expect(@updater.App.quit).to.be.calledOnce

      it "calls runInstaller on the client", ->
        c = @updater.client
        @updater.runInstaller("/Users/bmann/newApp")
        expect(@updater.client.runInstaller).to.be.calledWith("/Users/bmann/newApp", [c.getAppPath(), c.getAppExec(), "--updating"], {})

      it "passes along additional App argv", ->
        @updater.App.argv = ["--debug"]
        c = @updater.client
        @updater.runInstaller("/Users/bmann/newApp")
        expect(@updater.client.runInstaller).to.be.calledWith("/Users/bmann/newApp", [c.getAppPath(), c.getAppExec(), "--updating", "--debug"], {})

  context "integration", ->
    before ->
      ## 10 min timeout
      @timeout(10 * 60 * 1000)

      ## ensure we have the cypress.zip fixture
      Fixtures.ensureNwZip()

    beforeEach ->
      ## force a lower package.json version
      mock({
        "package.json": JSON.stringify(version: "0.0.1")
      })

      ## force a manifest.json response here to be a slightly higher version
      nock("https://s3.amazonaws.com")
        .get("/dist.cypress.io/manifest.json")
        .reply 200, {
          name: "cypress"
          version: "0.0.2"
          packages: {
            mac: {
              url: "https://s3.amazonaws.com/dist.cypress.io/0.0.2/cypress.zip"
            }
            win: {
              url: "https://s3.amazonaws.com/dist.cypress.io/0.0.2/cypress.zip"
            }
            linux: {
              url: "https://s3.amazonaws.com/dist.cypress.io/0.0.2/cypress.zip"
            }
          }
        }
        .get("/dist.cypress.io/0.0.2/cypress.zip")
        .reply 200, ->
          mock.restore()
          fs.createReadStream Fixtures.path("nw/cypress.zip")

    # it "runs", ->
    #   @updater = Updater({quit: @sandbox.spy()})
    #   @updater.run()

  context "#check", ->
    beforeEach ->
      @updater = Updater({quit: @sandbox.spy()})
      @updater.getClient()
      @sandbox.stub(@updater.client, "checkNewVersion")

    it "calls checkNewVersion", ->
      @updater.check()
      expect(@updater.client.checkNewVersion).to.be.called

    it "calls optsions.newVersionExists when there is a no version", ->
      @updater.client.checkNewVersion.callsArgWith(0, null, true, {})

      options = {onNewVersion: @sandbox.spy()}
      @updater.check(options)

      expect(options.onNewVersion).to.be.calledWith({})

    it "calls optsions.newVersionExists when there is a no version", ->
      @updater.client.checkNewVersion.callsArgWith(0, null, false)

      options = {onNoNewVersion: @sandbox.spy()}
      @updater.check(options)

      expect(options.onNoNewVersion).to.be.called
