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

describe("src/cy/commands/exec", function() {
  const okResponse = { code: 0 };

  return context("#exec", function() {
    beforeEach(function() {
      Cypress.config("execTimeout", 2500);

      //# call through normally on everything
      return cy.stub(Cypress, "backend").callThrough();
    });

    it("triggers 'exec' with the right options", function() {
      Cypress.backend.resolves(okResponse);

      return cy.exec("ls").then(() => expect(Cypress.backend).to.be.calledWith("exec", {
        cmd: "ls",
        timeout: 2500,
        env: {}
      }));
    });

    it("passes through environment variables", function() {
      Cypress.backend.resolves(okResponse);

      return cy.exec("ls", { env: { FOO: "foo" } }).then(() => expect(Cypress.backend).to.be.calledWith("exec", {
        cmd: "ls",
        timeout: 2500,
        env: {
          FOO: "foo"
        }
      }));
    });

    it("really works", () => // output is trimmed
    cy.exec("echo foo", { timeout: 20000 }).its("stdout").should("eq", "foo"));

    describe(".log", function() {
      beforeEach(function() {
        this.logs = [];

        cy.on("log:added", (attrs, log) => {
          this.lastLog = log;
          return this.logs.push(log);
        });

        return null;
      });

      it("can turn off logging", function() {
        Cypress.backend.resolves(okResponse);

        return cy.exec('ls', { log: false }).then(function() {
          const logs = _.filter(this.logs, log => log.get("name") === "exec");

          return expect(logs.length).to.eq(0);
        });
      });

      return it("logs immediately before resolving", function() {
        Cypress.backend.resolves(okResponse);

        cy.on("log:added", (attrs, log) => {
          if (attrs.name === "exec") {
            expect(log.get("state")).to.eq("pending");
            return expect(log.get("message")).to.eq("ls");
          }
        });

        return cy.exec("ls").then(() => {
          if (!this.lastLog) { throw new Error("failed to log before resolving"); }
        });
      });
    });

    describe("timeout", function() {
      it("defaults timeout to Cypress.config(execTimeout)", function() {
        Cypress.backend.resolves(okResponse);

        const timeout = cy.spy(Promise.prototype, "timeout");

        return cy.exec("ls").then(() => expect(timeout).to.be.calledWith(2500));
      });

      it("can override timeout", function() {
        Cypress.backend.resolves(okResponse);

        const timeout = cy.spy(Promise.prototype, "timeout");

        return cy.exec("li", { timeout: 1000 }).then(() => expect(timeout).to.be.calledWith(1000));
      });

      return it("clears the current timeout and restores after success", function() {
        Cypress.backend.resolves(okResponse);

        cy.timeout(100);

        const clearTimeout = cy.spy(cy, "clearTimeout");

        cy.on("exec", () => {
          return expect(clearTimeout).to.be.calledOnce;
        });

        return cy.exec("ls").then(() => expect(cy.timeout()).to.eq(100));
      });
    });

    return describe("errors", function() {
      beforeEach(function() {
        Cypress.config("defaultCommandTimeout", 50);

        this.logs = [];

        cy.on("log:added", (attrs, log) => {
          if (attrs.name === "exec") {
            this.lastLog = log;
            return this.logs.push(log);
          }
        });

        return null;
      });

      it("throws when cmd is absent", function(done) {
        cy.on("fail", err => {
          const {
            lastLog
          } = this;

          expect(this.logs.length).to.eq(1);
          expect(lastLog.get("error")).to.eq(err);
          expect(lastLog.get("state")).to.eq("failed");
          expect(err.message).to.eq("`cy.exec()` must be passed a non-empty string as its 1st argument. You passed: ''.");
          expect(err.docsUrl).to.eq("https://on.cypress.io/exec");
          return done();
        });

        return cy.exec();
      });

      it("throws when cmd isn't a string", function(done) {
        cy.on("fail", err => {
          const {
            lastLog
          } = this;

          expect(this.logs.length).to.eq(1);
          expect(lastLog.get("error")).to.eq(err);
          expect(lastLog.get("state")).to.eq("failed");
          expect(err.message).to.eq("`cy.exec()` must be passed a non-empty string as its 1st argument. You passed: '3'.");
          expect(err.docsUrl).to.eq("https://on.cypress.io/exec");
          return done();
        });

        return cy.exec(3);
      });

      it("throws when cmd is an empty string", function(done) {
        cy.on("fail", err => {
          const {
            lastLog
          } = this;

          expect(this.logs.length).to.eq(1);
          expect(lastLog.get("error")).to.eq(err);
          expect(lastLog.get("state")).to.eq("failed");
          expect(err.message).to.eq("`cy.exec()` must be passed a non-empty string as its 1st argument. You passed: ''.");
          expect(err.docsUrl).to.eq("https://on.cypress.io/exec");
          return done();
        });

        return cy.exec('');
      });

      it("throws when the execution errors", function(done) {
        Cypress.backend.rejects(new Error("exec failed"));

        cy.on("fail", err => {
          const {
            lastLog
          } = this;

          expect(this.logs.length).to.eq(1);
          expect(lastLog.get("error")).to.eq(err);
          expect(lastLog.get("state")).to.eq("failed");

          expect(err.message).to.eq("`cy.exec('ls')` failed with the following error:\n\n> \"Error: exec failed\"");
          expect(err.docsUrl).to.eq("https://on.cypress.io/exec");
          return done();
        });

        return cy.exec("ls");
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
          expect(err.message).to.eq("`cy.exec('ls')` timed out after waiting `50ms`.");
          expect(err.docsUrl).to.eq("https://on.cypress.io/exec");
          return done();
        });

        return cy.exec("ls", { timeout: 50 });
      });

      it("logs once on error", function(done) {
        Cypress.backend.rejects(new Error("exec failed"));

        cy.on("fail", err => {
          const {
            lastLog
          } = this;

          expect(this.logs.length).to.eq(1);
          expect(lastLog.get("error")).to.eq(err);
          expect(lastLog.get("state")).to.eq("failed");
          return done();
        });

        return cy.exec("ls");
      });

      it("can timeout from the backend's response", function(done) {
        const err = new Error("timeout");
        err.timedOut = true;

        Cypress.backend.rejects(err);

        cy.on("fail", function(err) {
          expect(err.message).to.include("`cy.exec('sleep 2')` timed out after waiting `100ms`.");
          expect(err.docsUrl).to.eq("https://on.cypress.io/exec");
          return done();
        });

        return cy.exec("sleep 2", {
          timeout: 100
        });
      });

      it("can really time out", function(done) {
        cy.on("fail", function(err) {
          expect(err.message).to.include("`cy.exec('sleep 2')` timed out after waiting `100ms`.");
          expect(err.docsUrl).to.eq("https://on.cypress.io/exec");
          return done();
        });

        return cy.exec("sleep 2", {
          timeout: 100
        });
      });

      return describe("when error code is non-zero", function() {
        it("throws error that includes useful information and exit code", function(done) {
          Cypress.backend.resolves({ code: 1 });

          cy.on("fail", function(err) {
            expect(err.message).to.contain("`cy.exec('ls')` failed because the command exited with a non-zero code.\n\nPass `{failOnNonZeroExit: false}` to ignore exit code failures.");
            expect(err.message).to.contain("Code: 1");
            expect(err.docsUrl).to.contain("https://on.cypress.io/exec");
            return done();
          });

          return cy.exec("ls");
        });

        it("throws error that includes stderr if it exists and is non-empty", function(done) {
          Cypress.backend.resolves({ code: 1, stderr: "error output", stdout: "" });

          cy.on("fail", function(err) {
            expect(err.message).to.contain("Stderr:\nerror output");
            expect(err.message).not.to.contain("Stdout");
            return done();
          });

          return cy.exec("ls");
        });

        it("throws error that includes stdout if it exists and is non-empty", function(done) {
          Cypress.backend.resolves({ code: 1, stderr: "", stdout: "regular output" });

          cy.on("fail", function(err) {
            expect(err.message).to.contain("\nStdout:\nregular output");
            expect(err.message).not.to.contain("Stderr");
            return done();
          });

          return cy.exec("ls");
        });

        it("throws error that includes stdout and stderr if they exists and are non-empty", function(done) {
          Cypress.backend.resolves({ code: 1, stderr: "error output", stdout: "regular output" });

          cy.on("fail", function(err) {
            expect(err.message).to.contain("\nStdout:\nregular output\nStderr:\nerror output");
            return done();
          });

          return cy.exec("ls");
        });

        it("truncates the stdout and stderr in the error message", function(done) {
          Cypress.backend.resolves({
            code: 1,
            stderr: `${_.range(200).join()}stderr should be truncated`,
            stdout: `${_.range(200).join()}stdout should be truncated`
          });

          cy.on("fail", function(err) {
            expect(err.message).not.to.contain("stderr should be truncated");
            expect(err.message).not.to.contain("stdout should be truncated");
            expect(err.message).to.contain("...");
            return done();
          });

          return cy.exec("ls");
        });

        it("can really fail", function(done) {
          cy.on("fail", err => {
            const {
              lastLog
            } = this;

            const { Yielded } = lastLog.invoke("consoleProps");

            // output is trimmed
            expect(Yielded).to.deep.eq({
              stdout: "foo",
              stderr: "",
              code: 1
            });

            return done();
          });

          return cy.exec("echo foo && exit 1");
        });

        return describe("and failOnNonZeroExit is false", function() {
          it("does not error", function() {
            const response = { code: 1, stderr: "error output", stdout: "regular output" };
            Cypress.backend.resolves(response);

            return cy
            .exec("ls", { failOnNonZeroExit: false })
            .should("deep.eq", response);
          });

          return it("does not really fail", () => cy.exec("echo foo && exit 1", {
            failOnNonZeroExit: false
          }));
        });
      });
    });
  });
});
