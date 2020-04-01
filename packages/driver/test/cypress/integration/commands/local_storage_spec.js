/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe("src/cy/commands/local_storage", () => context("#clearLocalStorage", function() {
  it("passes keys onto Cypress.LocalStorage.clear", function() {
    const clear = cy.spy(Cypress.LocalStorage, "clear");

    return cy.clearLocalStorage("foo").then(() => expect(clear).to.be.calledWith("foo"));
  });

  it("sets the storages", function() {
    const {
      localStorage
    } = window;
    const remoteStorage = cy.state("window").localStorage;

    const setStorages = cy.spy(Cypress.LocalStorage, "setStorages");

    return cy.clearLocalStorage().then(() => expect(setStorages).to.be.calledWith(localStorage, remoteStorage));
  });

  it("unsets the storages", function() {
    const unsetStorages = cy.spy(Cypress.LocalStorage, "unsetStorages");

    return cy.clearLocalStorage().then(() => expect(unsetStorages).to.be.called);
  });

  it("sets subject to remote localStorage", function() {
    const ls = cy.state("window").localStorage;

    return cy.clearLocalStorage().then(remote => expect(remote).to.eq(ls));
  });

  describe("test:before:run", () => it("clears localStorage before each test run", function() {
    const clear = cy.spy(Cypress.LocalStorage, "clear");

    Cypress.emit("test:before:run", {});

    return expect(clear).to.be.calledWith([]);
}));

  describe("errors", () => it("throws when being passed a non string or regexp", function(done) {
    cy.on("fail", function(err) {
      expect(err.message).to.include("`cy.clearLocalStorage()` must be called with either a string or regular expression.");
      expect(err.docsUrl).to.include("https://on.cypress.io/clearlocalstorage");
      return done();
    });
    // A number is used as an object will be considered as `options`
    return cy.clearLocalStorage(1);
  }));

  describe(".log", function() {
    beforeEach(function() {
      cy.on("log:added", (attrs, log) => {
        return this.lastLog = log;
      });

      return null;
    });

    it("ends immediately", () => cy.clearLocalStorage().then(function() {
      const {
        lastLog
      } = this;

      expect(lastLog.get("ended")).to.be.true;
      return expect(lastLog.get("state")).to.eq("passed");
    }));

    return it("snapshots immediately", () => cy.clearLocalStorage().then(function() {
      const {
        lastLog
      } = this;

      expect(lastLog.get("snapshots").length).to.eq(1);
      return expect(lastLog.get("snapshots")[0]).to.be.an("object");
    }));
  });

  return describe("without log", function() {
    beforeEach(function() {
      cy.on("log:added", (attrs, log) => {
        return this.lastLog = log;
      });

      return null;
    });
      
    it("log is disabled", () => cy.clearLocalStorage('foo', {log: false}).then(function() {
      const {
        lastLog
      } = this;

      return expect(lastLog).to.be.undefined;
    }));
    
    return it("log is disabled without key", () => cy.clearLocalStorage({log: false}).then(function() {
      const {
        lastLog
      } = this;

      return expect(lastLog).to.be.undefined;
    }));
  });
}));

