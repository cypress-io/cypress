/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require("../spec_helper");

const nmi         = require("node-machine-id");
const cwd         = require(`${root}lib/cwd`);
const request     = require("@cypress/request");
const Updater     = require(`${root}lib/updater`);
const pkg         = require("@packages/root");
const _           = require("lodash");

describe("lib/updater", function() {
  context("interface", () => it("returns an updater instance", function() {
    const u = new Updater({});
    return expect(u).to.be.instanceof(Updater);
  }));

  context("#getPackage", function() {
    beforeEach(function() {
      pkg.foo = "bar";
      return this.updater = new Updater({});
    });
    afterEach(() => delete pkg.foo);

    return it("inserts manifestUrl to package.json", function() {
      const expected = _.extend({}, pkg, {
        foo: "bar",
        manifestUrl: "https://download.cypress.io/desktop.json"
      });
      return expect(this.updater.getPackage()).to.deep.eq(expected);
    });
  });

  context("#getClient", function() {
    it("sets .client to new Updater", function() {
      const u = new Updater({});
      u.getClient();
      return expect(u.client).to.have.property("checkNewVersion");
    });

    return it("returns .client if exists", function() {
      const u = new Updater({});
      const client  = u.getClient();
      const client2 = u.getClient();
      return expect(client).to.eq(client2);
    });
  });

  context("#checkNewVersion", function() {
    beforeEach(function() {
      this.get = sinon.spy(request, "get");

      return this.updater = new Updater({});
    });

    it("sends x-cypress-version", function(done) {
      this.updater.getClient().checkNewVersion(() => {
        expect(this.get).to.be.calledWithMatch({
          headers: {
            "x-cypress-version": pkg.version
          }
        });
        return done();
      });
    });

    it("sends x-machine-id", function(done) {
      nmi.machineId()
      .then(id => {
        return this.updater.getClient().checkNewVersion(() => {
          expect(this.get).to.be.calledWithMatch({
            headers: {
              "x-machine-id": id
            }
          });
          return done();
        });
      });
    });

    return it("sends x-machine-id as null on error", function(done) {
      sinon.stub(nmi, "machineId").rejects(new Error());

      this.updater.getClient().checkNewVersion(() => {
        expect(this.get).to.be.calledWithMatch({
          headers: {
            "x-machine-id": null
          }
        });

        return done();
      });

    });
  });

  return context("#check", function() {
    beforeEach(function() {
      this.updater = new Updater({quit: sinon.spy()});
      this.updater.getClient();
      return sinon.stub(this.updater.client, "checkNewVersion");
    });

    it("calls checkNewVersion", function() {
      this.updater.check();
      return expect(this.updater.client.checkNewVersion).to.be.called;
    });

    it("calls options.newVersionExists when there is a no version", function() {
      this.updater.client.checkNewVersion.yields(null, true, {});

      const options = {onNewVersion: sinon.spy()};
      this.updater.check(options);

      return expect(options.onNewVersion).to.be.calledWith({});
    });

    return it("calls options.newVersionExists when there is a no version", function() {
      this.updater.client.checkNewVersion.yields(null, false);

      const options = {onNoNewVersion: sinon.spy()};
      this.updater.check(options);

      return expect(options.onNoNewVersion).to.be.called;
    });
  });
});
