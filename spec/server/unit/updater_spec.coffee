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
mock        = require "mock-fs"
sinon        = require "sinon"

describe.only "Updater", ->
  beforeEach ->
    @sandbox = sinon.sandbox.create()

  afterEach ->
    @sandbox.restore()
    mock.restore()

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
      @updater = Updater({})
      @updater.getClient()
      @checkNewVersion = @sandbox.stub(@updater.client, "checkNewVersion")
      @download        = @sandbox.stub(@updater,        "download")

    describe "client#checkNewVersion", ->
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

      it "does not call #download if there is an error", ->
        @checkNewVersion.callsArgWith(0, (new Error), true, {foo: "bar"})
        @updater.run()
        expect(@download).not.to.be.called

    describe "#download", ->

  context "integration", ->
    ## use fs mock here to force a lower package.json version number
    ## use nock here to forcibly return a manifest with a higher semver
    ## make sure the updater client does all the things its supposed to do
