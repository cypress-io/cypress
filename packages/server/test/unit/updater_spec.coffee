require("../spec_helper")

nmi         = require("node-machine-id")
cwd         = require("#{root}lib/cwd")
request     = require("request")
Updater     = require("#{root}lib/updater")
pkg         = require("@packages/root")
_           = require("lodash")

describe "lib/updater", ->
  context "interface", ->
    it "returns an updater instance", ->
      u = Updater({})
      expect(u).to.be.instanceof Updater

  context "#getPackage", ->
    beforeEach ->
      pkg.foo = "bar"
      @updater = Updater({})
    afterEach ->
      delete pkg.foo

    it "inserts manifestUrl to package.json", ->
      expected = _.extend({}, pkg, {
        foo: "bar"
        manifestUrl: "https://download.cypress.io/desktop.json"
      })
      expect(@updater.getPackage()).to.deep.eq expected

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

  context "#checkNewVersion", ->
    beforeEach ->
      @get = sinon.spy(request, "get")

      @updater = Updater({})

    it "sends x-cypress-version", (done) ->
      @updater.getClient().checkNewVersion =>
        expect(@get).to.be.calledWithMatch({
          headers: {
            "x-cypress-version": pkg.version
          }
        })
        done()

    it "sends x-machine-id", (done) ->
      nmi.machineId()
      .then (id) =>
        @updater.getClient().checkNewVersion =>
          expect(@get).to.be.calledWithMatch({
            headers: {
              "x-machine-id": id
            }
          })
          done()

    it "sends x-machine-id as null on error", (done) ->
      sinon.stub(nmi, "machineId").rejects(new Error())

      @updater.getClient().checkNewVersion =>
        expect(@get).to.be.calledWithMatch({
          headers: {
            "x-machine-id": null
          }
        })

        done()

  context "#check", ->
    beforeEach ->
      @updater = Updater({quit: sinon.spy()})
      @updater.getClient()
      sinon.stub(@updater.client, "checkNewVersion")

    it "calls checkNewVersion", ->
      @updater.check()
      expect(@updater.client.checkNewVersion).to.be.called

    it "calls options.newVersionExists when there is a no version", ->
      @updater.client.checkNewVersion.yields(null, true, {})

      options = {onNewVersion: sinon.spy()}
      @updater.check(options)

      expect(options.onNewVersion).to.be.calledWith({})

    it "calls options.newVersionExists when there is a no version", ->
      @updater.client.checkNewVersion.yields(null, false)

      options = {onNoNewVersion: sinon.spy()}
      @updater.check(options)

      expect(options.onNoNewVersion).to.be.called
