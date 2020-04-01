/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {
  _
} = Cypress;
const {
  Promise
} = Cypress;

describe("src/cy/commands/task", () => context("#task", function() {
  beforeEach(function() {
    Cypress.config("taskTimeout", 2500);

    return cy.stub(Cypress, "backend").callThrough();
  });

  it("calls Cypress.backend('task') with the right options", function() {
    Cypress.backend.resolves(null);

    return cy.task("foo").then(() => expect(Cypress.backend).to.be.calledWith("task", {
      task: "foo",
      timeout: 2500,
      arg: undefined
    }));
  });

  it("passes through arg", function() {
    Cypress.backend.resolves(null);

    return cy.task("foo", { foo: "foo" }).then(() => expect(Cypress.backend).to.be.calledWith("task", {
      task: "foo",
      timeout: 2500,
      arg: {
        foo: "foo"
      }
    }));
  });

  it("really works", () => cy.task("return:arg", "works").should("eq", "works"));

  describe(".log", function() {
    beforeEach(function() {
      this.logs = [];

      cy.on("log:added", (attrs, log) => {
        this.lastLog = log;
        return this.logs.push(log);
      });

      Cypress.backend.resolves(null);

      return null;
    });

    it("can turn off logging", () => cy.task("foo", null, { log: false }).then(function() {
      const logs = _.filter(this.logs, log => log.get("name") === "task");

      return expect(logs.length).to.eq(0);
    }));

    return it("logs immediately before resolving", function() {
      cy.on("log:added", (attrs, log) => {
        if (attrs.name === "task") {
          expect(log.get("state")).to.eq("pending");
          return expect(log.get("message")).to.eq("foo");
        }
      });

      return cy.task("foo").then(() => {
        if (!this.lastLog) { throw new Error("failed to log before resolving"); }
      });
    });
  });

  describe("timeout", function() {
    beforeEach(() => Cypress.backend.resolves(null));

    it("defaults timeout to Cypress.config(taskTimeout)", function() {
      const timeout = cy.spy(Promise.prototype, "timeout");

      return cy.task("foo").then(() => expect(timeout).to.be.calledWith(2500));
    });

    it("can override timeout", function() {
      const timeout = cy.spy(Promise.prototype, "timeout");

      return cy.task("foo", null, { timeout: 1000 }).then(() => expect(timeout).to.be.calledWith(1000));
    });

    return it("clears the current timeout and restores after success", function() {
      cy.timeout(100);

      const clearTimeout = cy.spy(cy, "clearTimeout");

      cy.on("task", () => {
        return expect(clearTimeout).to.be.calledOnce;
      });

      return cy.task("foo").then(() => expect(cy.timeout()).to.eq(100));
    });
  });

  return describe("errors", function() {
    beforeEach(function() {
      Cypress.config("defaultCommandTimeout", 50);

      this.logs = [];

      cy.on("log:added", (attrs, log) => {
        if (attrs.name === "task") {
          this.lastLog = log;
          return this.logs.push(log);
        }
      });

      return null;
    });

    it("throws when task is absent", function(done) {
      cy.on("fail", err => {
        const {
          lastLog
        } = this;

        expect(this.logs.length).to.eq(1);
        expect(lastLog.get("error")).to.eq(err);
        expect(lastLog.get("state")).to.eq("failed");
        expect(err.message).to.eq("`cy.task()` must be passed a non-empty string as its 1st argument. You passed: ``.");
        expect(err.docsUrl).to.eq("https://on.cypress.io/task");
        return done();
      });

      return cy.task();
    });

    it("throws when task isn't a string", function(done) {
      cy.on("fail", err => {
        const {
          lastLog
        } = this;

        expect(this.logs.length).to.eq(1);
        expect(lastLog.get("error")).to.eq(err);
        expect(lastLog.get("state")).to.eq("failed");
        expect(err.message).to.eq("`cy.task()` must be passed a non-empty string as its 1st argument. You passed: `3`.");
        expect(err.docsUrl).to.eq("https://on.cypress.io/task");
        return done();
      });

      return cy.task(3);
    });

    it("throws when task is an empty string", function(done) {
      cy.on("fail", err => {
        const {
          lastLog
        } = this;

        expect(this.logs.length).to.eq(1);
        expect(lastLog.get("error")).to.eq(err);
        expect(lastLog.get("state")).to.eq("failed");
        expect(err.message).to.eq("`cy.task()` must be passed a non-empty string as its 1st argument. You passed: ``.");
        expect(err.docsUrl).to.eq("https://on.cypress.io/task");
        return done();
      });

      return cy.task('');
    });

    it("throws when the task errors", function(done) {
      Cypress.backend.rejects(new Error("task failed"));

      cy.on("fail", err => {
        const {
          lastLog
        } = this;

        expect(this.logs.length).to.eq(1);
        expect(lastLog.get("error")).to.eq(err);
        expect(lastLog.get("state")).to.eq("failed");

        expect(err.message).to.include("`cy.task('foo')` failed with the following error:");
        expect(err.message).to.include("Error: task failed");
        return done();
      });

      return cy.task("foo");
    });

    it("throws when task is not registered by plugin", function(done) {
      cy.on("fail", err => {
        const {
          lastLog
        } = this;

        expect(this.logs.length).to.eq(1);
        expect(lastLog.get("error")).to.eq(err);
        expect(lastLog.get("state")).to.eq("failed");

        expect(err.message).to.eq(`\`cy.task('bar')\` failed with the following error:\n\nThe task 'bar' was not handled in the plugins file. The following tasks are registered: return:arg, wait, create:long:file\n\nFix this in your plugins file here:\n${Cypress.config('pluginsFile')}\n\nhttps://on.cypress.io/api/task`);
        return done();
      });

      return cy.task("bar");
    });

    it("throws after timing out", function(done) {
      Cypress.backend.resolves(Promise.delay(250));

      cy.on("fail", err => {
        const {
          lastLog
        } = this;

        expect(this.logs.length).to.eq(1);
        expect(lastLog.get("error")).to.eq(err);
        expect(lastLog.get("state")).to.eq("failed");
        expect(err.message).to.eq("`cy.task('foo')` timed out after waiting `50ms`.");
        expect(err.docsUrl).to.eq("https://on.cypress.io/task");
        return done();
      });

      return cy.task("foo", null, { timeout: 50 });
    });

    it("logs once on error", function(done) {
      Cypress.backend.rejects(new Error("task failed"));

      cy.on("fail", err => {
        const {
          lastLog
        } = this;

        expect(this.logs.length).to.eq(1);
        expect(lastLog.get("error")).to.eq(err);
        expect(lastLog.get("state")).to.eq("failed");
        return done();
      });

      return cy.task("foo");
    });

    it("can timeout from the backend's response", function(done) {
      const err = new Error("timeout");
      err.timedOut = true;

      Cypress.backend.rejects(err);

      cy.on("fail", function(err) {
        expect(err.message).to.include("`cy.task('wait')` timed out after waiting `100ms`.");
        expect(err.docsUrl).to.eq("https://on.cypress.io/task");
        return done();
      });

      return cy.task("wait", null, { timeout: 100 });
    });

    return it("can really time out", function(done) {
      cy.on("fail", function(err) {
        expect(err.message).to.include("`cy.task('wait')` timed out after waiting `100ms`.");
        expect(err.docsUrl).to.eq("https://on.cypress.io/task");
        return done();
      });

      return cy.task("wait", null, { timeout: 100 });
    });
  });
}));
