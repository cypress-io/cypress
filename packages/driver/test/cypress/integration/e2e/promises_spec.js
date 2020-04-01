/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe("promises", function() {
  beforeEach(function() {
    return this.warn = cy.spy(Cypress.Promise.prototype, "_warn");
  });

  afterEach(function() {
    return expect(this.warn).not.to.be.calledOnce;
  });

  it("warns when returning a promise and calling cypress commands", function() {
    cy.spy(top.console, "warn");

    const title = cy.state("runnable").fullTitle();

    return Cypress.Promise.delay(10)
    .then(function() {
      cy.wrap({});
      cy.wrap([]);
      return cy.wrap("lol")
      .then(function() {
        const msg = top.console.warn.firstCall.args[0];

        expect(msg).to.include("Cypress detected that you returned a promise in a test, but also invoked one or more cy commands inside of that promise.");
        expect(msg).to.include(title);
        expect(msg).to.include("https://on.cypress.io/returning-promise-and-commands-in-test");

        return expect(top.console.warn).to.be.calledOnce;
      });
    });
  });

  it("warns when instantiating a promise and calling cypress commands", function() {
    cy.spy(top.console, "warn");

    const title = cy.state("runnable").fullTitle();

    return new Cypress.Promise(function(resolve) {
      cy.wrap({});
      cy.wrap([]);
      return cy.wrap("lol")
      .then(resolve);}).then(function() {
      const msg = top.console.warn.firstCall.args[0];

      expect(msg).to.include("Cypress detected that you returned a promise in a test, but also invoked one or more cy commands inside of that promise.");
      expect(msg).to.include(title);
      expect(msg).to.include("https://on.cypress.io/returning-promise-and-commands-in-test");

      return expect(top.console.warn).to.be.calledOnce;
    });
  });

  it("throws when returning a promise from a custom command", function(done) {
    const logs = [];

    cy.on("log:added", (attrs, log) => {
      this.lastLog = log;

      return logs.push(log);
    });

    cy.on("fail", err => {
      const {
        lastLog
      } = this;

      expect(logs.length).to.eq(1);
      expect(lastLog.get("name")).to.eq("foo");
      expect(lastLog.get("error")).to.eq(err);

      expect(err.message).to.include("Cypress detected that you returned a promise from a command while also invoking one or more cy commands in that promise.");
      expect(err.message).to.include("> `cy.foo()`");
      expect(err.message).to.include("> `cy.wrap()`");
      expect(err.docsUrl).to.eq("https://on.cypress.io/returning-promise-and-commands-in-another-command");

      return done();
    });

    Cypress.Commands.add("foo", () => Cypress.Promise
    .delay(10)
    .then(() => cy.wrap({})));

    return cy.foo();
  });

  it("throws when instantiating a promise from a custom command", function(done) {
    const logs = [];

    cy.on("log:added", (attrs, log) => {
      this.lastLog = log;

      return logs.push(log);
    });

    cy.on("fail", err => {
      const {
        lastLog
      } = this;

      expect(logs.length).to.eq(1);
      expect(lastLog.get("name")).to.eq("foo");
      expect(lastLog.get("error")).to.eq(err);

      expect(err.message).to.include("Cypress detected that you returned a promise from a command while also invoking one or more cy commands in that promise.");
      expect(err.message).to.include("> `cy.foo()`");
      expect(err.message).to.include("> `cy.wrap()`");

      return done();
    });

    Cypress.Commands.add("foo", () => new Cypress.Promise(resolve => cy.wrap({}).then(resolve)));

    return cy.foo();
  });

  it("is okay to return promises from custom commands with no cy commands", function() {
    Cypress.Commands.add("foo", () => Cypress.Promise
    .delay(10));

    return cy.foo();
  });

  it("can return a promise that throws on its own without warning", () => Cypress.Promise
  .delay(10)
  .then(() => cy.wrap({}).should("deep.eq", {})).then(function(obj) {
    expect(obj).to.deep.eq({});

    throw new Error("foo");}).catch(function() {}));

  return it("can still fail cypress commands", function(done) {
    cy.on("fail", function(err) {
      expect(err.message).to.eq("foo");
      return done();
    });

    Cypress.Promise
    .delay(10)
    .then(() => cy.wrap({}).then(function() {
      throw new Error("foo");
    }));
  });
});
