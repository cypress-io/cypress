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

describe("src/cy/commands/cookies", function() {
  beforeEach(() => //# call through normally on everything

  cy.stub(Cypress, "automation").rejects(new Error('Cypress.automation was not stubbed')));

  context("test:before:run:async", function() {

    it("can test unstubbed, real server", function() {
      Cypress.automation.restore();
      return cy.setCookie('foo', 'bar');
    });

    it("clears cookies before each test run", function() {
      Cypress.automation
      .withArgs("get:cookies", { domain: "localhost" })
      .resolves([ { name: "foo" } ])
      .withArgs("clear:cookies", [ { domain: "localhost", name: "foo" } ])
      .resolves([]);

      return Cypress.emitThen("test:before:run:async", {})
      .then(function() {
        expect(Cypress.automation).to.be.calledWith(
          "get:cookies",
          { domain: "localhost" }
        );

        return expect(Cypress.automation).to.be.calledWith(
          "clear:cookies",
          [ { domain: "localhost", name: "foo" } ]
        );
      });
    });

    it("does not call clear:cookies when get:cookies returns empty array", function() {
      Cypress.automation.withArgs("get:cookies").resolves([]);

      return Cypress.emitThen("test:before:run:async", {})
      .then(() => expect(Cypress.automation).not.to.be.calledWith(
        "clear:cookies"
      ));
    });

    return it("does not attempt to time out", function() {
      Cypress.automation
      .withArgs("get:cookies", { domain: "localhost" })
      .resolves([ { name: "foo" } ])
      .withArgs("clear:cookies", [ { domain: "localhost", name: "foo" } ])
      .resolves([]);

      const timeout = cy.spy(Promise.prototype, "timeout");

      return Cypress.emitThen("test:before:run:async", {})
      .then(() => expect(timeout).not.to.be.called);
    });
  });

  context("#getCookies", function() {
    it("returns array of cookies", function() {
      Cypress.automation.withArgs("get:cookies").resolves([]);

      return cy.getCookies().should("deep.eq", []).then(() => expect(Cypress.automation).to.be.calledWith(
        "get:cookies",
        { domain: "localhost" }
      ));
    });

    describe("timeout", function() {
      it("sets timeout to Cypress.config(responseTimeout)", function() {
        Cypress.config("responseTimeout", 2500);

        Cypress.automation.resolves([]);

        const timeout = cy.spy(Promise.prototype, "timeout");

        return cy.getCookies().then(() => expect(timeout).to.be.calledWith(2500));
      });

      it("can override timeout", function() {
        Cypress.automation.resolves([]);

        const timeout = cy.spy(Promise.prototype, "timeout");

        return cy.getCookies({timeout: 1000}).then(() => expect(timeout).to.be.calledWith(1000));
      });

      return it("clears the current timeout and restores after success", function() {
        Cypress.automation.resolves([]);

        cy.timeout(100);

        cy.spy(cy, "clearTimeout");

        return cy.getCookies().then(function() {
          expect(cy.clearTimeout).to.be.calledWith("get:cookies");

          //# restores the timeout afterwards
          return expect(cy.timeout()).to.eq(100);
        });
      });
    });

    describe("errors", function() {
      beforeEach(function() {
        Cypress.config("defaultCommandTimeout", 50);

        this.logs = [];

        cy.on("log:added", (attrs, log) => {
          if (attrs.name === "getCookies") {
            this.lastLog = log;
            return this.logs.push(log);
          }
        });

        return null;
      });

      it("logs once on error", function(done) {
        const error = new Error("some err message");
        error.name = "foo";
        error.stack = "stack";

        Cypress.automation.rejects(error);

        cy.on("fail", err => {
          const {
            lastLog
          } = this;

          expect(this.logs.length).to.eq(1);

          expect(lastLog.get("error").message).to.contain(`\`cy.getCookies()\` had an unexpected error reading cookies from ${Cypress.browser.displayName}.`);
          expect(lastLog.get("error").message).to.contain("some err message");
          expect(lastLog.get("error").message).to.contain(error.stack);
          return done();
        });

        return cy.getCookies();
      });

      return it("throws after timing out", function(done) {
        Cypress.automation.resolves(Promise.delay(1000));

        cy.on("fail", err => {
          const {
            lastLog
          } = this;

          expect(this.logs.length).to.eq(1);
          expect(lastLog.get("error")).to.eq(err);
          expect(lastLog.get("state")).to.eq("failed");
          expect(lastLog.get("name")).to.eq("getCookies");
          expect(lastLog.get("message")).to.eq("");
          expect(err.message).to.eq("`cy.getCookies()` timed out waiting `50ms` to complete.");
          expect(err.docsUrl).to.eq("https://on.cypress.io/getcookies");
          return done();
        });

        return cy.getCookies({timeout: 50});
      });
    });

    return describe(".log", function() {
      beforeEach(function() {
        cy.on("log:added", (attrs, log) => {
          if (attrs.name === "getCookies") {
            return this.lastLog = log;
          }
        });

        return Cypress.automation
        .withArgs("get:cookies", { domain: "localhost" })
        .resolves([
          {name: "foo", value: "bar", domain: "localhost", path: "/", secure: true, httpOnly: false}
         ]);
      });

      it("can turn off logging", () => cy.getCookies({log: false}).then(function() {
        return expect(this.lastLog).to.be.undefined;
      }));

      it("ends immediately", () => cy.getCookies().then(function() {
        const {
          lastLog
        } = this;

        expect(lastLog.get("ended")).to.be.true;
        return expect(lastLog.get("state")).to.eq("passed");
      }));

      it("snapshots immediately", () => cy.getCookies().then(function() {
        const {
          lastLog
        } = this;

        expect(lastLog.get("snapshots").length).to.eq(1);
        return expect(lastLog.get("snapshots")[0]).to.be.an("object");
      }));

      it("displays name 'get cookies'", () => cy.getCookies().then(function() {
        const {
          lastLog
        } = this;

        return expect(lastLog.get("displayName")).to.eq("get cookies");
      }));

      return it("#consoleProps", () => cy.getCookies().then(function(cookies) {
        expect(cookies).to.deep.eq([{name: "foo", value: "bar", domain: "localhost", path: "/", secure: true, httpOnly: false}]);
        const c = this.lastLog.invoke("consoleProps");
        expect(c["Yielded"]).to.deep.eq(cookies);
        return expect(c["Num Cookies"]).to.eq(1);
      }));
    });
  });

  context("#getCookie", function() {
    it("returns single cookie by name", function() {
      Cypress.automation.withArgs("get:cookie").resolves({
        name: "foo", value: "bar", domain: "localhost", path: "/", secure: true, httpOnly: false
      });

      return cy.getCookie("foo").should("deep.eq", {
        name: "foo", value: "bar", domain: "localhost", path: "/", secure: true, httpOnly: false
      }).then(() => expect(Cypress.automation).to.be.calledWith(
        "get:cookie",
        { domain: "localhost", name: "foo" }
      ));
    });

    it("returns null when no cookie was found", function() {
      Cypress.automation.withArgs("get:cookie").resolves(null);

      return cy.getCookie("foo").should("be.null");
    });

    describe("timeout", function() {
      it("sets timeout to Cypress.config(responseTimeout)", function() {
        Cypress.config("responseTimeout", 2500);

        Cypress.automation.resolves(null);

        const timeout = cy.spy(Promise.prototype, "timeout");

        return cy.getCookie("foo").then(() => expect(timeout).to.be.calledWith(2500));
      });

      it("can override timeout", function() {
        Cypress.automation.resolves(null);

        const timeout = cy.spy(Promise.prototype, "timeout");

        return cy.getCookie("foo", {timeout: 1000}).then(() => expect(timeout).to.be.calledWith(1000));
      });

      return it("clears the current timeout and restores after success", function() {
        Cypress.automation.resolves(null);

        cy.timeout(100);

        cy.spy(cy, "clearTimeout");

        return cy.getCookie("foo").then(function() {
          expect(cy.clearTimeout).to.be.calledWith("get:cookie");

          //# restores the timeout afterwards
          return expect(cy.timeout()).to.eq(100);
        });
      });
    });

    describe("errors", function() {
      beforeEach(function() {
        Cypress.config("defaultCommandTimeout", 50);

        this.logs = [];

        cy.on("log:added", (attrs, log) => {
          if (attrs.name === "getCookie") {
            this.lastLog = log;
            return this.logs.push(log);
          }
        });

        return null;
      });

      it("logs once on error", function(done) {
        const error = new Error("some err message");
        error.name = "foo";
        error.stack = "stack";

        Cypress.automation.rejects(error);

        cy.on("fail", err => {
          const {
            lastLog
          } = this;

          expect(this.logs.length).to.eq(1);

          expect(lastLog.get("error").message).to.contain(`\`cy.getCookie()\` had an unexpected error reading the requested cookie from ${Cypress.browser.displayName}.`);
          expect(lastLog.get("error").message).to.contain("some err message");
          expect(lastLog.get("error").message).to.contain(error.stack);
          return done();
        });

        return cy.getCookie("foo");
      });

      it("throws after timing out", function(done) {
        Cypress.automation.resolves(Promise.delay(1000));

        cy.on("fail", err => {
          const {
            lastLog
          } = this;

          expect(this.logs.length).to.eq(1);
          expect(lastLog.get("error")).to.eq(err);
          expect(lastLog.get("state")).to.eq("failed");
          expect(lastLog.get("name")).to.eq("getCookie");
          expect(lastLog.get("message")).to.eq("foo");
          expect(err.message).to.eq("`cy.getCookie()` timed out waiting `50ms` to complete.");
          expect(err.docsUrl).to.eq("https://on.cypress.io/getcookie");
          return done();
        });

        return cy.getCookie("foo", {timeout: 50});
      });

      return it("requires a string name", function(done) {
        cy.on("fail", err => {
          const {
            lastLog
          } = this;

          expect(this.logs.length).to.eq(1);
          expect(lastLog.get("error").message).to.eq("`cy.getCookie()` must be passed a string argument for name.");
          expect(lastLog.get("error").docsUrl).to.eq("https://on.cypress.io/getcookie");
          expect(lastLog.get("error")).to.eq(err);
          return done();
        });

        return cy.getCookie(123);
      });
    });

    return describe(".log", function() {
      beforeEach(function() {
        cy.on("log:added", (attrs, log) => {
          if (attrs.name === "getCookie") {
            return this.lastLog = log;
          }
        });

        return Cypress.automation
        .withArgs("get:cookie", { domain: "localhost", name: "foo" })
        .resolves({
          name: "foo", value: "bar", domain: "localhost", path: "/", secure: true, httpOnly: false
         })
        .withArgs("get:cookie", { domain: "localhost", name: "bar" })
        .resolves(null);
      });

      it("can turn off logging", () => cy.getCookie("foo", {log: false}).then(function() {
        return expect(this.log).to.be.undefined;
      }));

      it("ends immediately", () => cy.getCookie("foo").then(function() {
        const {
          lastLog
        } = this;

        expect(lastLog.get("ended")).to.be.true;
        return expect(lastLog.get("state")).to.eq("passed");
      }));

      it("has correct message", () => cy.getCookie("foo").then(function() {
        const {
          lastLog
        } = this;

        return expect(lastLog.get("message")).to.eq("foo");
      }));

      it("snapshots immediately", () => cy.getCookie("foo").then(function() {
        const {
          lastLog
        } = this;

        expect(lastLog.get("snapshots").length).to.eq(1);
        return expect(lastLog.get("snapshots")[0]).to.be.an("object");
      }));

      it("displays name 'get cookie'", () => cy.getCookie("foo").then(function() {
        const {
          lastLog
        } = this;

        return expect(lastLog.get("displayName")).to.eq("get cookie");
      }));

      it("#consoleProps", () => cy.getCookie("foo").then(function(cookie) {
        expect(cookie).to.deep.eq({name: "foo", value: "bar", domain: "localhost", path: "/", secure: true, httpOnly: false});
        const c = this.lastLog.invoke("consoleProps");
        return expect(c["Yielded"]).to.deep.eq(cookie);
      }));

      return it("#consoleProps when no cookie found", () => cy.getCookie("bar").then(function(cookie) {
        expect(cookie).to.be.null;
        const c = this.lastLog.invoke("consoleProps");
        expect(c["Yielded"]).to.eq("null");
        return expect(c["Note"]).to.eq("No cookie with the name: 'bar' was found.");
      }));
    });
  });

  context("#setCookie", function() {
    beforeEach(() => cy.stub(Cypress.utils, "addTwentyYears").returns(12345));

    it("returns set cookie", function() {
      Cypress.automation.withArgs("set:cookie").resolves({
        name: "foo", value: "bar", domain: "localhost", path: "/", secure: false, httpOnly: false, expiry: 12345
      });

      return cy.setCookie("foo", "bar").should("deep.eq", {
        name: "foo", value: "bar", domain: "localhost", path: "/", secure: false, httpOnly: false, expiry: 12345
      }).then(() => expect(Cypress.automation).to.be.calledWith(
        "set:cookie",
        { domain: "localhost", name: "foo", value: "bar", path: "/", secure: false, httpOnly: false, expiry: 12345, sameSite: undefined }
      ));
    });

    it("can change options", function() {
      Cypress.automation.withArgs("set:cookie").resolves({
        name: "foo", value: "bar", domain: "brian.dev.local", path: "/foo", secure: true, httpOnly: true, expiry: 987
      });

      return cy.setCookie("foo", "bar", {domain: "brian.dev.local", path: "/foo", secure: true, httpOnly: true, expiry: 987}).should("deep.eq", {
        name: "foo", value: "bar", domain: "brian.dev.local", path: "/foo", secure: true, httpOnly: true, expiry: 987
      }).then(() => expect(Cypress.automation).to.be.calledWith(
        "set:cookie",
        { domain: "brian.dev.local", name: "foo", value: "bar", path: "/foo", secure: true, httpOnly: true, expiry: 987, sameSite: undefined }
      ));
    });

    it("does not mutate options", function() {
      Cypress.automation.resolves();
      const options = {};

      return cy.setCookie("foo", "bar", {}).then(() => expect(options).deep.eq({}));
    });

    it("can set cookies with sameSite", function() {
      Cypress.automation.restore();
      Cypress.utils.addTwentyYears.restore();

      Cypress.sinon.stub(Cypress, 'config').callThrough()
      .withArgs('experimentalGetCookiesSameSite').returns(true);

      cy.setCookie('one', 'bar', { sameSite: 'none', secure: true });
      cy.getCookie('one').should('include', { sameSite: 'no_restriction' });

      cy.setCookie('two', 'bar', { sameSite: 'no_restriction', secure: true });
      cy.getCookie('two').should('include', { sameSite: 'no_restriction' });

      cy.setCookie('three', 'bar', { sameSite: 'Lax' });
      cy.getCookie('three').should('include', { sameSite: 'lax' });

      cy.setCookie('four', 'bar', { sameSite: 'Strict' });
      cy.getCookie('four').should('include', { sameSite: 'strict' });

      cy.setCookie('five', 'bar');

      //# @see https://bugzilla.mozilla.org/show_bug.cgi?id=1624668
      if (Cypress.isBrowser('firefox')) {
        return cy.getCookie('five').should('include', { sameSite: 'no_restriction' });
      } else {
        return cy.getCookie('five').should('not.have.property', 'sameSite');
      }
    });

    describe("timeout", function() {
      it("sets timeout to Cypress.config(responseTimeout)", function() {
        Cypress.config("responseTimeout", 2500);

        Cypress.automation.resolves(null);

        const timeout = cy.spy(Promise.prototype, "timeout");

        return cy.setCookie("foo", "bar").then(() => expect(timeout).to.be.calledWith(2500));
      });

      it("can override timeout", function() {
        Cypress.automation.resolves(null);

        const timeout = cy.spy(Promise.prototype, "timeout");

        return cy.setCookie("foo", "bar", {timeout: 1000}).then(() => expect(timeout).to.be.calledWith(1000));
      });

      return it("clears the current timeout and restores after success", function() {
        Cypress.automation.resolves(null);

        cy.timeout(100);

        cy.spy(cy, "clearTimeout");

        return cy.setCookie("foo", "bar").then(function() {
          expect(cy.clearTimeout).to.be.calledWith("set:cookie");

          //# restores the timeout afterwards
          return expect(cy.timeout()).to.eq(100);
        });
      });
    });

    describe("errors", function() {
      beforeEach(function() {
        Cypress.config("defaultCommandTimeout", 50);

        this.logs = [];

        cy.on("log:added", (attrs, log) => {
          if (attrs.name === "setCookie") {
            this.lastLog = log;
            return this.logs.push(log);
          }
        });

        return null;
      });

      it("logs once on error", function(done) {
        const error = new Error("some err message");
        error.name = "foo";

        Cypress.automation.rejects(error);

        cy.on("fail", err => {
          const {
            lastLog
          } = this;

          expect(this.logs.length).to.eq(1);
          expect(lastLog.get("error").message).to.include("some err message");
          expect(lastLog.get("error").name).to.eq("CypressError");
          expect(lastLog.get("error").stack).to.include(error.stack);
          return done();
        });

        return cy.setCookie("foo", "bar");
      });

      it("throws after timing out", function(done) {
        Cypress.automation.resolves(Promise.delay(1000));

        cy.on("fail", err => {
          const {
            lastLog
          } = this;

          expect(this.logs.length).to.eq(1);
          expect(lastLog.get("error")).to.eq(err);
          expect(lastLog.get("state")).to.eq("failed");
          expect(lastLog.get("name")).to.eq("setCookie");
          expect(lastLog.get("message")).to.eq("foo, bar");
          expect(err.message).to.include("`cy.setCookie()` timed out waiting `50ms` to complete.");
          expect(err.docsUrl).to.eq("https://on.cypress.io/setcookie");
          return done();
        });

        return cy.setCookie("foo", "bar", {timeout: 50});
      });

      it("requires a string name", function(done) {
        cy.on("fail", err => {
          const {
            lastLog
          } = this;

          expect(this.logs.length).to.eq(1);
          expect(lastLog.get("error").message).to.eq("`cy.setCookie()` must be passed two string arguments for `name` and `value`.");
          expect(lastLog.get("error").docsUrl).to.eq("https://on.cypress.io/setcookie");
          expect(lastLog.get("error")).to.eq(err);
          return done();
        });

        return cy.setCookie(123);
      });

      it("requires a string value", function(done) {
        cy.on("fail", err => {
          const {
            lastLog
          } = this;

          expect(this.logs.length).to.eq(1);
          expect(lastLog.get("error").message).to.eq("`cy.setCookie()` must be passed two string arguments for `name` and `value`.");
          expect(lastLog.get("error").docsUrl).to.eq("https://on.cypress.io/setcookie");
          expect(lastLog.get("error")).to.eq(err);
          return done();
        });

        return cy.setCookie("foo", 123);
      });

      it("when an invalid samesite prop is supplied", function(done) {
        cy.on("fail", err => {
          const {
            lastLog
          } = this;

          expect(this.logs.length).to.eq(1);
          expect(lastLog.get("error").message).to.eq(`\
If a \`sameSite\` value is supplied to \`cy.setCookie()\`, it must be a string from the following list:
  > no_restriction, lax, strict
You passed:
  > bad\
`
          );
          expect(lastLog.get("error").docsUrl).to.eq("https://on.cypress.io/setcookie");
          expect(lastLog.get("error")).to.eq(err);
          return done();
        });

        return cy.setCookie('foo', 'bar', { sameSite: 'bad' });
      });

      it("when samesite=none is supplied and secure is not set", function(done) {
        cy.on("fail", err => {
          const {
            lastLog
          } = this;

          expect(this.logs.length).to.eq(1);
          expect(lastLog.get("error").message).to.eq(`\
Only cookies with the \`secure\` flag set to \`true\` can use \`sameSite: 'None'\`.

Pass \`secure: true\` to \`cy.setCookie()\` to set a cookie with \`sameSite: 'None'\`.\
`
          );
          expect(lastLog.get("error").docsUrl).to.eq("https://on.cypress.io/setcookie");
          expect(lastLog.get("error")).to.eq(err);
          return done();
        });

        return cy.setCookie('foo', 'bar', { sameSite: 'None' });
      });

      return context("when setting an invalid cookie", () => it("throws an error if the backend responds with an error", function(done) {
        const err = new Error("backend could not set cookie");

        Cypress.automation.withArgs("set:cookie").rejects(err);

        cy.on("fail", err => {
          expect(Cypress.automation.withArgs("set:cookie")).to.be.calledOnce;
          expect(err.message).to.contain('unexpected error setting the requested cookie');
          expect(err.message).to.contain(err.message);
          return done();
        });

        //# browser backend should yell since this is invalid
        return cy.setCookie("foo", " bar");
      }));
    });

    return describe(".log", function() {
      beforeEach(function() {
        cy.on("log:added", (attrs, log) => {
          if (attrs.name === "setCookie") {
            return this.lastLog = log;
          }
        });

        return Cypress.automation
        .withArgs("set:cookie", {
          domain: "localhost", name: "foo", value: "bar", path: "/", secure: false, httpOnly: false, expiry: 12345, sameSite: undefined
        })
        .resolves({
          name: "foo", value: "bar", domain: "localhost", path: "/", secure: true, httpOnly: false
         });
      });

      it("can turn off logging", () => cy.setCookie("foo", "bar", {log: false}).then(function() {
        return expect(this.log).to.be.undefined;
      }));

      it("ends immediately", () => cy.setCookie("foo", "bar").then(function() {
        const {
          lastLog
        } = this;

        expect(lastLog.get("ended")).to.be.true;
        return expect(lastLog.get("state")).to.eq("passed");
      }));

      it("snapshots immediately", function() {
        cy.setCookie("foo", "bar").then(function() {
          const {
            lastLog
          } = this;

          expect(lastLog.get("snapshots").length).to.eq(1);
          expect(lastLog.get("snapshots")[0]).to.be.an("object");

          return it("displays name 'set cookie'", function() {});
        });
        return cy.setCookie("foo", "bar").then(function() {
          const {
            lastLog
          } = this;

          return expect(lastLog.get("displayName")).to.eq("set cookie");
        });
      });

      return it("#consoleProps", () => cy.setCookie("foo", "bar").then(function(cookie) {
        expect(cookie).to.deep.eq({name: "foo", value: "bar", domain: "localhost", path: "/", secure: true, httpOnly: false});
        const c = this.lastLog.invoke("consoleProps");
        return expect(c["Yielded"]).to.deep.eq(cookie);
      }));
    });
  });

  context("#clearCookie", function() {
    it("returns null", function() {
      Cypress.automation.withArgs("clear:cookie").resolves(null);

      return cy.clearCookie("foo").should("be.null").then(() => expect(Cypress.automation).to.be.calledWith(
        "clear:cookie",
        { domain: "localhost", name: "foo" }
      ));
    });

    describe("timeout", function() {
      it("sets timeout to Cypress.config(responseTimeout)", function() {
        Cypress.config("responseTimeout", 2500);

        Cypress.automation.resolves(null);

        const timeout = cy.spy(Promise.prototype, "timeout");

        return cy.clearCookie("foo").then(() => expect(timeout).to.be.calledWith(2500));
      });

      it("can override timeout", function() {
        Cypress.automation.resolves(null);

        const timeout = cy.spy(Promise.prototype, "timeout");

        return cy.clearCookie("foo", {timeout: 1000}).then(() => expect(timeout).to.be.calledWith(1000));
      });

      return it("clears the current timeout and restores after success", function() {
        Cypress.automation.resolves([]);

        cy.timeout(100);

        cy.spy(cy, "clearTimeout");

        return cy.clearCookie("foo").then(function() {
          expect(cy.clearTimeout).to.be.calledWith("clear:cookie");

          //# restores the timeout afterwards
          return expect(cy.timeout()).to.eq(100);
        });
      });
    });

    describe("errors", function() {
      beforeEach(function() {
        Cypress.config("defaultCommandTimeout", 50);

        this.logs = [];

        cy.on("log:added", (attrs, log) => {
          if (attrs.name === "clearCookie") {
            this.lastLog = log;
            return this.logs.push(log);
          }
        });

        return null;
      });

      it("logs once on error", function(done) {
        const error = new Error("some err message");
        error.name = "foo";
        error.stack = "stack";

        Cypress.automation.rejects(error);

        cy.on("fail", err => {
          const {
            lastLog
          } = this;

          expect(this.logs.length).to.eq(1);
          expect(lastLog.get("error").message).to.contain(`\`cy.clearCookie()\` had an unexpected error clearing the requested cookie in ${Cypress.browser.displayName}.`);
          expect(lastLog.get("error").message).to.contain("some err message");
          expect(lastLog.get("error").message).to.contain(error.stack);
          return done();
        });

        return cy.clearCookie("foo");
      });

      it("throws after timing out", function(done) {
        Cypress.automation.resolves(Promise.delay(1000));

        cy.on("fail", err => {
          const {
            lastLog
          } = this;

          expect(this.logs.length).to.eq(1);
          expect(lastLog.get("error")).to.eq(err);
          expect(lastLog.get("state")).to.eq("failed");
          expect(lastLog.get("name")).to.eq("clearCookie");
          expect(lastLog.get("message")).to.eq("foo");
          expect(err.message).to.eq("`cy.clearCookie()` timed out waiting `50ms` to complete.");
          expect(err.docsUrl).to.eq("https://on.cypress.io/clearcookie");
          return done();
        });

        return cy.clearCookie("foo", {timeout: 50});
      });

      return it("requires a string name", function(done) {
        cy.on("fail", err => {
          const {
            lastLog
          } = this;

          expect(this.logs.length).to.eq(1);
          expect(lastLog.get("error").message).to.eq("`cy.clearCookie()` must be passed a string argument for name.");
          expect(lastLog.get("error").docsUrl).to.eq("https://on.cypress.io/clearcookie");
          expect(lastLog.get("error")).to.eq(err);
          return done();
        });

        return cy.clearCookie(123);
      });
    });

    return describe(".log", function() {
      beforeEach(function() {
        cy.on("log:added", (attrs, log) => {
          if (attrs.name === "clearCookie") {
            return this.lastLog = log;
          }
        });

        return Cypress.automation
        .withArgs("clear:cookie", { domain: "localhost", name: "foo" })
        .resolves({
          name: "foo", value: "bar", domain: "localhost", path: "/", secure: true, httpOnly: false
         })
         .withArgs("clear:cookie", { domain: "localhost", name: "bar" })
         .resolves(null);
      });

      it("can turn off logging", () => cy.clearCookie("foo", {log: false}).then(function() {
        return expect(this.log).to.be.undefined;
      }));

      it("ends immediately", () => cy.clearCookie("foo").then(function() {
        const {
          lastLog
        } = this;

        expect(lastLog.get("ended")).to.be.true;
        return expect(lastLog.get("state")).to.eq("passed");
      }));

      it("snapshots immediately", function() {
        cy.clearCookie("foo").then(function() {
          const {
            lastLog
          } = this;

          expect(lastLog.get("snapshots").length).to.eq(1);
          expect(lastLog.get("snapshots")[0]).to.be.an("object");

          return it("displays name 'clear cookie'", function() {});
        });
        return cy.clearCookie("foo").then(function() {
          const {
            lastLog
          } = this;

          return expect(lastLog.get("displayName")).to.eq("clear cookie");
        });
      });

      it("#consoleProps", () => cy.clearCookie("foo").then(function(cookie) {
        expect(cookie).to.be.null;
        const c = this.lastLog.invoke("consoleProps");
        expect(c["Yielded"]).to.eq("null");
        return expect(c["Cleared Cookie"]).to.deep.eq({name: "foo", value: "bar", domain: "localhost", path: "/", secure: true, httpOnly: false});}));

      return it("#consoleProps when no matching cookie was found", () => cy.clearCookie("bar").then(function(cookie) {
        expect(cookie).to.be.null;
        const c = this.lastLog.invoke("consoleProps");
        expect(c["Yielded"]).to.eq("null");
        expect(c["Cleared Cookie"]).to.be.undefined;
        return expect(c["Note"]).to.eq("No cookie with the name: 'bar' was found or removed.");
      }));
    });
  });

  return context("#clearCookies", function() {
    it("returns null", function() {
      Cypress.automation.withArgs("get:cookies").resolves([]);

      return cy.clearCookies().should("be.null");
    });

    it("does not call 'clear:cookies' when no cookies were returned", function() {
      Cypress.automation.withArgs("get:cookies").resolves([]);

      return cy.clearCookies().then(() => expect(Cypress.automation).not.to.be.calledWith(
        "clear:cookies"
      ));
    });

    it("calls 'clear:cookies' only with clearableCookies", function() {
      Cypress.automation
      .withArgs("get:cookies")
      .resolves([
        { name: "foo" },
        { name: "bar" }
      ])
      .withArgs("clear:cookies", [
        { name: "foo", domain: "localhost" }
      ])
      .resolves({
        name: "foo"
      });

      cy.stub(Cypress.Cookies, "getClearableCookies")
      .withArgs([{name: "foo"}, {name: "bar"}])
      .returns([{name: "foo"}]);

      return cy.clearCookies().should("be.null").then(() => expect(Cypress.automation).to.be.calledWith(
        "clear:cookies",
        [ { name: "foo", domain: "localhost" } ]
      ));
    });

    it("calls 'clear:cookies' with all cookies", function() {
      Cypress.Cookies.preserveOnce("bar", "baz");

      Cypress.automation
      .withArgs("get:cookies")
      .resolves([
        { name: "foo" },
        { name: "bar" },
        { name: "baz" }
      ])
      .withArgs("clear:cookies", [
        { name: "foo", domain: "localhost" }
      ])
      .resolves({
        name: "foo"
      })
      .withArgs("clear:cookies", [
        { name: "foo", domain: "localhost" },
        { name: "bar", domain: "localhost" },
        { name: "baz", domain: "localhost" }
      ])
      .resolves({
        name: "foo"
      });

      return cy
        .clearCookies().should("be.null").then(() => expect(Cypress.automation).to.be.calledWith(
        "clear:cookies",
        [ { name: "foo", domain: "localhost" } ]
      )).clearCookies().should("be.null").then(() => expect(Cypress.automation).to.be.calledWith(
        "clear:cookies", [
          { name: "foo", domain: "localhost" },
          { name: "bar", domain: "localhost" },
          { name: "baz", domain: "localhost" }
        ]
      ));
    });

    describe("timeout", function() {
      beforeEach(() => Cypress.automation
      .withArgs("get:cookies")
      .resolves([{}])
      .withArgs("clear:cookies")
      .resolves({}));

      it("sets timeout to Cypress.config(responseTimeout)", function() {
        Cypress.config("responseTimeout", 2500);

        Cypress.automation.resolves([]);

        const timeout = cy.spy(Promise.prototype, "timeout");

        return cy.clearCookies().then(() => expect(timeout).to.be.calledWith(2500));
      });

      it("can override timeout", function() {
        Cypress.automation.resolves([]);

        const timeout = cy.spy(Promise.prototype, "timeout");

        return cy.clearCookies({timeout: 1000}).then(() => expect(timeout).to.be.calledWith(1000));
      });

      return it("clears the current timeout and restores after success", function() {
        cy.timeout(100);

        cy.spy(cy, "clearTimeout");

        return cy.clearCookies().then(function() {
          expect(cy.clearTimeout).to.be.calledWith("get:cookies");
          expect(cy.clearTimeout).to.be.calledWith("clear:cookies");
          //# restores the timeout afterwards
          return expect(cy.timeout()).to.eq(100);
        });
      });
    });

    describe("errors", function() {
      beforeEach(function() {
        Cypress.config("defaultCommandTimeout", 50);

        this.logs = [];

        cy.on("log:added", (attrs, log) => {
          if (attrs.name === "clearCookies") {
            this.lastLog = log;
            return this.logs.push(log);
          }
        });

        return null;
      });

      it("logs once on 'get:cookies' error", function(done) {
        const error = new Error("some err message");
        error.name = "foo";
        error.stack = "stack";

        Cypress.automation.rejects(error);

        cy.on("fail", err => {
          const {
            lastLog
          } = this;

          expect(this.logs.length).to.eq(1);
          expect(lastLog.get("error").message).to.contain(`\`cy.clearCookies()\` had an unexpected error clearing cookies in ${Cypress.browser.displayName}.`);
          expect(lastLog.get("error").message).to.contain("some err message");
          expect(lastLog.get("error").message).to.contain(error.stack);
          expect(lastLog.get("error")).to.eq(err);
          return done();
        });

        return cy.clearCookies();
      });

      it("throws after timing out", function(done) {
        Cypress.automation.resolves([{ name: "foo" }]);
        Cypress.automation.withArgs("clear:cookies").resolves(Promise.delay(1000));

        cy.on("fail", err => {
          const {
            lastLog
          } = this;

          expect(this.logs.length).to.eq(1);
          expect(lastLog.get("error")).to.eq(err);
          expect(lastLog.get("state")).to.eq("failed");
          expect(lastLog.get("name")).to.eq("clearCookies");
          expect(lastLog.get("message")).to.eq("");
          expect(err.message).to.eq("`cy.clearCookies()` timed out waiting `50ms` to complete.");
          expect(err.docsUrl).to.eq("https://on.cypress.io/clearcookies");
          return done();
        });

        return cy.clearCookies({timeout: 50});
      });

      return it("logs once on 'clear:cookies' error", function(done) {
        Cypress.automation.withArgs("get:cookies").resolves([
          {name: "foo"}, {name: "bar"}
        ]);

        const error = new Error("some err message");
        error.name = "foo";
        error.stack = "stack";

        Cypress.automation.withArgs("clear:cookies").rejects(error);

        cy.on("fail", err => {
          const {
            lastLog
          } = this;

          expect(this.logs.length).to.eq(1);
          expect(lastLog.get("error").message).to.contain(`\`cy.clearCookies()\` had an unexpected error clearing cookies in ${Cypress.browser.displayName}.`);
          expect(lastLog.get("error").message).to.contain("some err message");
          expect(lastLog.get("error").message).to.contain(error.stack);
          expect(lastLog.get("error")).to.eq(err);
          return done();
        });

        return cy.clearCookies();
      });
    });

    describe(".log", function() {
      beforeEach(function() {
        cy.on("log:added", (attrs, log) => {
          if (attrs.name === "clearCookies") {
            return this.lastLog = log;
          }
        });

        return Cypress.automation
        .withArgs("get:cookies", { domain: "localhost" })
        .resolves([ { name: "foo" } ])
        .withArgs("clear:cookies", [ { name: "foo", domain: "localhost" } ])
        .resolves([
          { name: "foo" }
        ]);
      });

      it("can turn off logging", () => cy.clearCookies({log: false}).then(function() {
        return expect(this.log).to.be.undefined;
      }));

      it("ends immediately", () => cy.clearCookies().then(function() {
        const {
          lastLog
        } = this;

        expect(lastLog.get("ended")).to.be.true;
        return expect(lastLog.get("state")).to.eq("passed");
      }));

      it("snapshots immediately", function() {
        cy.clearCookies().then(function() {
          const {
            lastLog
          } = this;

          expect(lastLog.get("snapshots").length).to.eq(1);
          expect(lastLog.get("snapshots")[0]).to.be.an("object");

          return it("displays name 'get cookies'", function() {});
        });
        return cy.clearCookies().then(function() {
          const {
            lastLog
          } = this;

          return expect(lastLog.get("displayName")).to.eq("clear cookies");
        });
      });

      return it("#consoleProps", () => cy.clearCookies().then(function(cookies) {
        expect(cookies).to.be.null;
        const c = this.lastLog.invoke("consoleProps");
        expect(c["Yielded"]).to.eq("null");
        expect(c["Cleared Cookies"]).to.deep.eq([{name: "foo"}]);
        return expect(c["Num Cookies"]).to.eq(1);
      }));
    });

    describe(".log with no cookies returned", function() {
      beforeEach(function() {
        cy.on("log:added", (attrs, log) => {
          if (attrs.name === "clearCookies") {
            return this.lastLog = log;
          }
        });

        return Cypress.automation
        .withArgs("get:cookies", { domain: "localhost" })
        .resolves([]);
      });

      return it("#consoleProps", () => cy.clearCookies().then(function(cookies) {
        expect(cookies).to.be.null;
        const c = this.lastLog.invoke("consoleProps");
        expect(c["Yielded"]).to.eq("null");
        expect(c["Cleared Cookies"]).to.be.undefined;
        return expect(c["Note"]).to.eq("No cookies were found or removed.");
      }));
    });

    return describe(".log when no cookies were cleared", function() {
      beforeEach(function() {
        cy.on("log:added", (attrs, log) => {
          if (attrs.name === "clearCookies") {
            return this.lastLog = log;
          }
        });

        return Cypress.automation
        .withArgs("get:cookies", { domain: "localhost" })
        .resolves([ { name: "foo" } ])
        .withArgs("clear:cookies", [ { name: "foo", domain: "localhost" } ])
        .resolves([]);
      });

      return it("#consoleProps", () => cy.clearCookies().then(function(cookies) {
        expect(cookies).to.be.null;
        const c = this.lastLog.invoke("consoleProps");
        expect(c["Yielded"]).to.eq("null");
        expect(c["Cleared Cookies"]).to.be.undefined;
        return expect(c["Note"]).to.eq("No cookies were found or removed.");
      }));
    });
  });
});
