/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const { $ } = Cypress;
const { _ } = Cypress;

const helpers = require("../../support/helpers");

describe("src/cy/commands/assertions", function() {
  before(() =>
    cy
      .visit("/fixtures/jquery.html")
      .then(function(win) {
        return this.body = win.document.body.outerHTML;
    })
  );

  beforeEach(function() {
    const doc = cy.state("document");

    return $(doc.body).empty().html(this.body);
  });

  context("#should", function() {
    beforeEach(function() {
      this.logs = [];

      cy.on("log:added", (attrs, log) => {
        this.logs.push(log);
        return this.lastLog = log;
      });

      return null;
    });

    it("returns the subject for chainability", () =>
      cy.noop({foo: "bar"}).should("deep.eq", {foo: "bar"}).then(obj => expect(obj).to.deep.eq({foo: "bar"}))
  );

    it("can use negation", () => cy.noop(false).should("not.be.true"));

    it("works with jquery chai", function() {
      const div = $("<div class='foo'>asdf</div>");

      cy.$$("body").append(div);

      return cy
        .get("div.foo").should("have.class", "foo").then(function($div) {
          expect($div).to.match(div);
          return $div.remove();
      });
    });

    it("can chain multiple assertions", () =>
      cy
        .get("body")
          .should("contain", "div")
          .should("have.property", "length", 1)
    );

    it("skips over utility commands", function() {
      cy.on("command:retry", _.after(2, () => {
        return cy.$$("div:first").addClass("foo");
      })
      );

      cy.on("command:retry", _.after(4, () => {
        return cy.$$("div:first").attr("id", "bar");
      })
      );

      return cy.get("div:first").should("have.class", "foo").debug().and("have.id", "bar");
    });

    it("skips over aliasing", function() {
      cy.on("command:retry", _.after(2, () => {
        return cy.$$("div:first").addClass("foo");
      })
      );

      cy.on("command:retry", _.after(4, () => {
        return cy.$$("div:first").attr("id", "bar");
      })
      );

      return cy.get("div:first").as("div").should("have.class", "foo").debug().and("have.id", "bar");
    });

    it("can change the subject", () =>
      cy.get("input:first").should("have.property", "length").should("eq", 1).then(num => expect(num).to.eq(1))
    );

    it("changes the subject with chai-jquery", function() {
      cy.$$("input:first").attr("id", "input");

      return cy.get("input:first").should("have.attr", "id").should("eq", "input");
    });

    it("changes the subject with JSON", function() {
      const obj = {requestJSON: {teamIds: [2]}};
      return cy.noop(obj).its("requestJSON").should("have.property", "teamIds").should("deep.eq", [2]);
    });

    //# TODO: make cy.then retry
    //# https://github.com/cypress-io/cypress/issues/627
    it.skip("outer assertions retry on cy.then", function() {
      const obj = {foo: "bar"};

      return cy.wrap(obj).then(function() {
        setTimeout(() => obj.foo = "baz"
        , 1000);

        return obj;}).should("deep.eq", {foo: "baz"});
    });

    it("does it retry when wrapped", function() {
      const obj = { foo: "bar" };

      return cy.wrap(obj).then(function() {
        setTimeout(() => obj.foo = "baz"
        , 100);

        return cy.wrap(obj);}).should("deep.eq", { foo: "baz" });
    });

    describe("function argument", function() {
      it("waits until function is true", function() {
        const button = cy.$$("button:first");

        cy.on("command:retry", _.after(2, () => {
          return button.addClass("ready");
        })
        );

        return cy.get("button:first").should($button => expect($button).to.have.class("ready"));
      });

      it("works with regular objects", function() {
        const obj = {};

        cy.on("command:retry", _.after(2, () => {
          return obj.foo = "bar";
        })
        );

        return cy.wrap(obj).should(o => expect(o).to.have.property("foo").and.eq("bar")).then(function() {
          //# wrap + have property + and eq
          return expect(this.logs.length).to.eq(3);
        });
      });

      it("logs two assertions", function() {
        _.delay(() => {
          return cy.$$("body").addClass("foo");
        }
        , Math.random() * 300);

        _.delay(() => {
          return cy.$$("body").prop("id", "bar");
        }
        , Math.random() * 300);

        return cy
          .get("body").should(function($body) {
            expect($body).to.have.class("foo");
            return expect($body).to.have.id("bar");}).then(function() {
            cy.$$("body").removeClass("foo").removeAttr("id");

            expect(this.logs.length).to.eq(3);

            //# the messages should have been updated to reflect
            //# the current state of the <body> element
            expect(this.logs[1].get("message")).to.eq("expected **<body#bar.foo>** to have class **foo**");
            return expect(this.logs[2].get("message")).to.eq("expected **<body#bar.foo>** to have id **bar**");
        });
      });

      it("logs assertions as children even if subject is different", function() {
        _.delay(() => {
          return cy.$$("body").addClass("foo");
        }
        , Math.random() * 300);

        _.delay(() => {
          return cy.$$("body").prop("id", "bar");
        }
        , Math.random() * 300);

        return cy
          .get("body").should(function($body) {
            expect($body.attr("class")).to.match(/foo/);
            return expect($body.attr("id")).to.include("bar");}).then(function() {
            cy.$$("body").removeClass("foo").removeAttr("id");

            const types = _.map(this.logs, l => l.get("type"));
            expect(types).to.deep.eq(["parent", "child", "child"]);

            return expect(this.logs.length).to.eq(4);
        });
      });

      return context("remote jQuery instances", function() {
        beforeEach(function() {
          return this.remoteWindow = cy.state("window");
        });

        return it("yields the remote jQuery instance", function() {
          let fn;
          this.remoteWindow.$.fn.__foobar = (fn = function() {});

          return cy
            .get("input:first").should(function($input) {
              const isInstanceOf = Cypress.utils.isInstanceOf($input, this.remoteWindow.$);
              const hasProp = $input.__foobar === fn;

              expect(isInstanceOf).to.be.true;
              return expect(hasProp).to.to.true;
          });
        });
      });
    });

    describe("not.exist", function() {
      it("resolves eventually not exist", function() {
        const button = cy.$$("button:first");

        cy.on("command:retry", _.after(2, _.once(() => button.remove())
        )
        );

        return cy.get("button:first").click().should("not.exist");
      });

      return it("resolves all 3 assertions", function(done) {
        const logs = [];

        cy.on("log:added", function(attrs, log) {
          if (log.get("name") === "assert") {
            logs.push(log);

            if (logs.length === 3) {
              return done();
            }
          }
        });

        return cy
          .get("#does-not-exist1").should("not.exist")
          .get("#does-not-exist2").should("not.exist")
          .get("#does-not-exist3").should("not.exist");
      });
    });

    describe("have.text", () =>
      it("resolves the assertion", () =>
        cy.get("#list li").eq(0).should("have.text", "li 0").then(function() {
          const { lastLog } = this;

          expect(lastLog.get("name")).to.eq("assert");
          expect(lastLog.get("state")).to.eq("passed");
          return expect(lastLog.get("ended")).to.be.true;
        })
      )
    );

    describe("have.length", function() {
      it("allows valid string numbers", function() {
        const { length } = cy.$$("button");

        return cy.get("button").should("have.length", `${length}`);
      });

      it("throws when should('have.length') isnt a number", function(done) {
        cy.on("fail", function(err) {
          expect(err.message).to.eq("You must provide a valid number to a length assertion. You passed: 'asdf'");
          return done();
        });

        return cy.get("button").should("have.length", "asdf");
      });

      it("does not log extra commands on fail and properly fails command + assertions", function(done) {
        cy.on("fail", err => {
          expect(this.logs.length).to.eq(6);

          expect(this.logs[3].get("name")).to.eq("get");
          expect(this.logs[3].get("state")).to.eq("failed");
          expect(this.logs[3].get("error")).to.eq(err);

          expect(this.logs[4].get("name")).to.eq("assert");
          expect(this.logs[4].get("state")).to.eq("failed");
          expect(this.logs[4].get("error").name).to.eq("AssertionError");

          return done();
        });

        return cy
          .root().should("exist").and("contain", "foo")
          .get("button").should("have.length", "asdf");
      });

      return it("finishes failed assertions and does not log extra commands when cy.contains fails", function(done) {
        cy.on("fail", err => {
          expect(this.logs.length).to.eq(2);

          expect(this.logs[0].get("name")).to.eq("contains");
          expect(this.logs[0].get("state")).to.eq("failed");
          expect(this.logs[0].get("error")).to.eq(err);

          expect(this.logs[1].get("name")).to.eq("assert");
          expect(this.logs[1].get("state")).to.eq("failed");
          expect(this.logs[1].get("error").name).to.eq("AssertionError");

          return done();
        });

        return cy.contains("Nested Find").should("have.length", 2);
      });
    });

    describe("have.class", function() {
      it("snapshots and ends the assertion after retrying", function() {
        cy.on("command:retry", _.after(3, () => {
          return cy.$$("#foo").addClass("active");
        })
        );

        return cy.contains("foo").should("have.class", "active").then(function() {
          const { lastLog } = this;

          expect(lastLog.get("name")).to.eq("assert");
          expect(lastLog.get("ended")).to.be.true;
          expect(lastLog.get("state")).to.eq("passed");
          expect(lastLog.get("snapshots").length).to.eq(1);
          return expect(lastLog.get("snapshots")[0]).to.be.an("object");
        });
      });

      return it("retries assertion until true", function() {
        const button = cy.$$("button:first");

        const retry = _.after(3, () => button.addClass("new-class"));

        cy.on("command:retry", retry);

        return cy.get("button:first").should("have.class", "new-class");
      });
    });

    describe("errors", function() {
      beforeEach(() => Cypress.config("defaultCommandTimeout", 50));

      it("should not be true", function(done) {
        cy.on("fail", function(err) {
          expect(err.message).to.eq("expected false to be true");
          return done();
        });

        return cy.noop(false).should("be.true");
      });

      it("throws err when not available chainable", function(done) {
        cy.on("fail", function(err) {
          expect(err.message).to.eq("The chainer: 'dee' was not found. Could not build assertion.");
          return done();
        });

        return cy.noop({}).should("dee.eq", {});
      });

      it("throws err when ends with a non available chainable", function(done) {
        cy.on("fail", function(err) {
          expect(err.message).to.eq("The chainer: 'eq2' was not found. Could not build assertion.");
          return done();
        });

        return cy.noop({}).should("deep.eq2", {});
      });

      it("logs 'should' when non available chainer", function(done) {
        cy.on("fail", err => {
          const { lastLog } = this;

          expect(this.logs.length).to.eq(2);
          expect(lastLog.get("name")).to.eq("should");
          expect(lastLog.get("error")).to.eq(err);
          expect(lastLog.get("state")).to.eq("failed");
          expect(lastLog.get("snapshots").length).to.eq(1);
          expect(lastLog.get("snapshots")[0]).to.be.an("object");
          expect(lastLog.get("message")).to.eq("not.contain2, does-not-exist-foo-bar");
          return done();
        });

        return cy.get("div:first").should("not.contain2", "does-not-exist-foo-bar");
      });

      it("throws when eventually times out", function(done) {
        cy.on("fail", function(err) {
          expect(err.message).to.eq("Timed out retrying: expected '<button>' to have class 'does-not-have-class'");
          return done();
        });

        return cy.get("button:first").should("have.class", "does-not-have-class");
      });

      it("throws when the subject isnt in the DOM", function(done) {
        cy.$$("button:first").click(function() {
          return $(this).addClass("foo").remove();
        });

        cy.on("fail", err => {
          const names = _.invokeMap(this.logs, "get", "name");

          //# the 'should' is not here because based on
          //# when we check for the element to be detached
          //# it never actually runs the assertion
          expect(names).to.deep.eq(["get", "click"]);
          expect(err.message).to.include("cy.should() failed because this element is detached");
          return done();
        });

        return cy.get("button:first").click().should("have.class", "foo").then(() => done("cy.should was supposed to fail"));
      });

      it("throws when the subject eventually isnt in the DOM", function(done) {
        cy.timeout(200);

        const button = cy.$$("button:first");

        cy.on("command:retry", _.after(2, _.once(() => button.addClass("foo").remove())
        )
        );

        cy.on("fail", err => {
          const names = _.invokeMap(this.logs, "get", "name");

          //# should is present here due to the retry
          expect(names).to.deep.eq(["get", "click", "assert"]);
          expect(err.message).to.include("cy.should() failed because this element is detached");
          return done();
        });

        return cy.get("button:first").click().should("have.class", "foo").then(() => done("cy.should was supposed to fail"));
      });

      it("throws when should('have.length') isnt a number", function(done) {
        //# we specifically turn off logging have.length validation errors
        //# because the assertion will already be logged
        cy.on("fail", err => {
          const { lastLog } = this;

          expect(this.logs.length).to.eq(3);
          expect(err.message).to.eq("You must provide a valid number to a length assertion. You passed: 'foo'");
          expect(lastLog.get("name")).to.eq("should");
          expect(lastLog.get("error")).to.eq(err);
          expect(lastLog.get("state")).to.eq("failed");
          expect(lastLog.get("snapshots").length).to.eq(1);
          expect(lastLog.get("snapshots")[0]).to.be.an("object");
          expect(lastLog.get("message")).to.eq("have.length, foo");
          return done();
        });

        return cy.get("button").should("have.length", "foo");
      });

      it("eventually.have.length is deprecated", function(done) {
        cy.on("fail", err => {
          const { lastLog } = this;

          expect(this.logs.length).to.eq(2);
          expect(err.message).to.eq("The 'eventually' assertion chainer has been deprecated. This is now the default behavior so you can safely remove this word and everything should work as before.");
          expect(lastLog.get("name")).to.eq("should");
          expect(lastLog.get("error")).to.eq(err);
          expect(lastLog.get("state")).to.eq("failed");
          expect(lastLog.get("snapshots").length).to.eq(1);
          expect(lastLog.get("snapshots")[0]).to.be.an("object");
          expect(lastLog.get("message")).to.eq("eventually.have.length, 1");
          return done();
        });

        return cy.get("div:first").should("eventually.have.length", 1);
      });

      it("does not additionally log when .should is the current command", function(done) {
        cy.on("fail", err => {
          const { lastLog } = this;

          expect(this.logs.length).to.eq(1);
          expect(lastLog.get("name")).to.eq("should");
          expect(lastLog.get("error")).to.eq(err);
          expect(lastLog.get("state")).to.eq("failed");
          expect(lastLog.get("snapshots").length).to.eq(1);
          expect(lastLog.get("snapshots")[0]).to.be.an("object");
          expect(lastLog.get("message")).to.eq("deep.eq2, {}");

          return done();
        });

        return cy.noop({}).should("deep.eq2", {});
      });

      it("logs and immediately fails on custom match assertions", function(done) {
        cy.on("fail", err => {
          const { lastLog } = this;

          expect(this.logs.length).to.eq(2);
          expect(err.message).to.eq("'match' requires its argument be a 'RegExp'. You passed: 'foo'");
          expect(lastLog.get("name")).to.eq("should");
          expect(lastLog.get("error")).to.eq(err);
          expect(lastLog.get("state")).to.eq("failed");
          expect(lastLog.get("snapshots").length).to.eq(1);
          expect(lastLog.get("snapshots")[0]).to.be.an("object");
          expect(lastLog.get("message")).to.eq("match, foo");
          return done();
        });

        return cy.wrap("foo").should("match", "foo");
      });

      it("does not log ensureElExistence errors", function(done) {
        cy.on("fail", err => {
          expect(this.logs.length).to.eq(1);
          return done();
        });

        return cy.get("#does-not-exist");
      });

      return it("throws if used as a parent command", function(done) {
        cy.on("fail", err => {
          expect(this.logs.length).to.eq(1);
          expect(err.message).to.include("looks like you are trying to call a child command before running a parent command");

          return done();
        });

        return cy.should(function() {});
      });
    });

    return describe(".log", function() {
      it("is type child", () =>
        cy.get("button").should("match", "button").then(function() {
          const { lastLog } = this;

          expect(lastLog.get("name")).to.eq("assert");
          return expect(lastLog.get("type")).to.eq("child");
        })
      );

      return it("is type child when alias between assertions", () =>
        cy.get("button").as("btn").should("match", "button").then(function() {
          const { lastLog } = this;

          expect(lastLog.get("name")).to.eq("assert");
          return expect(lastLog.get("type")).to.eq("child");
        })
      );
    });
  });

  context("#and", () =>
    it("proxies to #should", () => cy.noop({foo: "bar"}).should("have.property", "foo").and("eq", "bar"))
  );

  context("#assert", function() {
    beforeEach(function() {
      this.logs = [];

      cy.on("log:added", (attrs, log) => {
        this.logs.push(log);

        if (attrs.name === "assert") {
          return this.lastLog = log;
        }
      });

      return null;
    });

    it("does not output should logs on failures", function(done) {
      cy.on("fail", () => {
        const { length } = this.logs;

        expect(length).to.eq(1);
        return done();
      });

      return cy.noop({}).should("have.property", "foo");
    });

    it("ends and snapshots immediately and sets child", function(done) {
      cy.on("log:added", (attrs, log) => {
        if (attrs.name === "assert") {
          cy.removeAllListeners("log:added");

          expect(log.get("ended")).to.be.true;
          expect(log.get("state")).to.eq("passed");
          expect(log.get("snapshots").length).to.eq(1);
          expect(log.get("snapshots")[0]).to.be.an("object");
          expect(log.get("type")).to.eq("child");

          return done();
        }
      });

      return cy.get("body").then(() => expect(cy.state("subject")).to.match("body"));
    });

    it("sets type to child when subject matches", function(done) {
      cy.on("log:added", (attrs, log) => {
        if (attrs.name === "assert") {
          cy.removeAllListeners("log:added");
          expect(log.get("type")).to.eq("child");
          return done();
        }
      });

      return cy.wrap("foo").then(() => expect("foo").to.eq("foo"));
    });

    it("sets type to child current command had arguments but does not match subject", function(done) {
      cy.on("log:added", (attrs, log) => {
        if (attrs.name === "assert") {
          cy.removeAllListeners("log:added");
          expect(log.get("type")).to.eq("child");
          return done();
        }
      });

      return cy.get("body").then($body => expect($body.length).to.eq(1));
    });

    it("sets type to parent when assertion did not involve current subject and didnt have arguments", function(done) {
      cy.on("log:added", (attrs, log) => {
        if (attrs.name === "assert") {
          cy.removeAllListeners("log:added");
          expect(log.get("type")).to.eq("parent");
          return done();
        }
      });

      return cy.get("body").then(() => expect(true).to.be.true);
    });

    it("removes rest of line when passing assertion includes ', but' for jQuery subjects", function(done) {
      cy.on("log:added", function(attrs, log) {
        if (attrs.name === "assert") {
          cy.removeAllListeners("log:added");
          expect(log.get("message")).to.eq("expected **<a>** to have attribute **href** with the value **#**");
          return done();
        }
      });

      return cy.get("a:first").then($a => expect($a).to.have.attr("href", "#"));
    });

    it("does not replaces instances of word: 'but' with 'and' for failing assertion", function(done) {
      cy.on("log:added", function(attrs, log) {
        if (attrs.name === "assert") {
          cy.removeAllListeners("log:added");

          expect(log.get("message")).to.eq("expected **<a>** to have attribute **href** with the value **asdf**, but the value was **#**");
          return done();
        }
      });

      return cy.get("a:first").then(function($a) {
        try {
          return expect($a).to.have.attr("href", "asdf");
        } catch (error) {}
      });
    });

    it("does not replace 'button' with 'andton'", function(done) {
      cy.on("log:added", function(attrs, log) {
        if (attrs.name === "assert") {
          cy.removeAllListeners("log:added");

          expect(log.get("message")).to.eq("expected **<button>** to be **visible**");
          return done();
        }
      });

      return cy.get("button:first").then($button => expect($button).to.be.visible);
    });

    it("#consoleProps for regular objects", function(done) {
      cy.on("log:added", (attrs, log) => {
        if (attrs.name === "assert") {
          cy.removeAllListeners("log:added");

          expect(log.invoke("consoleProps")).to.deep.eq({
            Command: "assert",
            expected: 1,
            actual: 1,
            Message: "expected 1 to equal 1"
          });

          return done();
        }
      });

      return cy.then(() => expect(1).to.eq(1));
    });

    it("#consoleProps for DOM objects", function(done) {
      cy.on("log:added", (attrs, log) => {
        if (attrs.name === "assert") {
          cy.removeAllListeners("log:added");

          expect(log.invoke("consoleProps")).to.deep.eq({
            Command: "assert",
            subject: log.get("subject"),
            Message: "expected <body> to have a property length"
          });

          return done();
        }
      });

      return cy
        .get("body").then($body => expect($body).to.have.property("length"));
    });

    it("#consoleProps for errors", function(done) {
      cy.on("log:added", (attrs, log) => {
        if (attrs.name === "assert") {
          cy.removeAllListeners("log:added");

          expect(log.invoke("consoleProps")).to.deep.eq({
            Command: "assert",
            expected: false,
            actual: true,
            Message: "expected true to be false",
            Error: log.get("error").toString()
          });
          return done();
        }
      });

      return cy.then(function() {
        try {
          return expect(true).to.be.false;
        } catch (err) {}
      });
    });

    return describe("#patchAssert", function() {
      it("wraps \#{this} and \#{exp} in \#{b}", function(done) {
        cy.on("log:added", (attrs, log) => {
          if (attrs.name === "assert") {
            cy.removeAllListeners("log:added");

            expect(log.get("message")).to.eq("expected **foo** to equal **foo**");
            return done();
          }
        });

        return cy.then(() => expect("foo").to.eq("foo"));
      });

      it("doesnt mutate error message", () =>
        cy.then(function() {
          try {
            return expect(true).to.eq(false);
          } catch (e) {
            return expect(e.message).to.eq("expected true to equal false");
          }
        })
      );

      return describe("jQuery elements", function() {
        it("sets _obj to selector", function(done) {
          cy.on("log:added", (attrs, log) => {
            if (attrs.name === "assert") {
              cy.removeAllListeners("log:added");

              expect(log.get("message")).to.eq("expected **<body>** to exist in the DOM");
              return done();
            }
          });

          return cy.get("body").then($body => expect($body).to.exist);
        });

        it("matches empty string attributes", function(done) {
          cy.on("log:added", (attrs, log) => {
            if (attrs.name === "assert") {
              cy.removeAllListeners("log:added");

              expect(log.get("message")).to.eq("expected **<input>** to have attribute **value** with the value **''**");
              return done();
            }
          });

          cy.$$("body").prepend($("<input value='' />"));
          return cy.get("input").eq(0).then($input => expect($input).to.have.attr('value', ''));
        });

        it("can chain off of chai-jquery assertions", function() {
          const $el = cy.$$('ul#list');
          return expect($el).to.be.visible.and.have.id('list');
        });

        describe("without selector", function() {
          it("exists", function(done) {
            cy.on("log:added", (attrs, log) => {
              if (attrs.name === "assert") {
                cy.removeAllListeners("log:added");

                expect(log.get("message")).to.eq("expected **<div>** to exist in the DOM");
                return done();
              }
            });

            //# prepend an empty div so it has no id or class
            cy.$$("body").prepend($("<div />"));

            return cy.get("div").eq(0).then($div =>
              // expect($div).to.match("div")
              expect($div).to.exist
            );
          });

          return it("uses element name", function(done) {
            cy.on("log:added", (attrs, log) => {
              if (attrs.name === "assert") {
                cy.removeAllListeners("log:added");

                expect(log.get("message")).to.eq("expected **<input>** to match **input**");
                return done();
              }
            });

            //# prepend an empty div so it has no id or class
            cy.$$("body").prepend($("<input />"));

            return cy.get("input").eq(0).then($div => expect($div).to.match("input"));
          });
        });

        return describe("property assertions", function() {
          it("has property", function(done) {
            cy.on("log:added", function(attrs, log) {
              if (attrs.name === "assert") {
                cy.removeAllListeners("log:added");

                expect(log.get("message")).to.eq("expected **<button>** to have a property **length**");
                return done();
              }
            });

            return cy.get("button:first").should("have.property", "length");
          });

          return it("passes on expected subjects without changing them", function() {
            cy.state("window").$.fn.foo = "bar";

            return cy
              .get("input:first").then($input => expect($input).to.have.property("foo", "bar"));
          });
        });
      });
    });
  });

  context("chai assert", function() {
    beforeEach(function() {
      this.logs = [];

      cy.on("log:added", (attrs, log) => {
        return this.logs.push(log);
      });

      return null;
    });

    it("equal", function() {
      assert.equal(1, 1, "one is one");
      return expect(this.logs[0].get("message")).to.eq("one is one: expected **1** to equal **1**");
    });

    it("isOk", function() {
      assert.isOk({}, "is okay");
      return expect(this.logs[0].get("message")).to.eq("is okay: expected **{}** to be truthy");
    });

    return it("isFalse", function() {
      assert.isFalse(false, "is false");
      return expect(this.logs[0].get("message")).to.eq("is false: expected **false** to be false");
    });
  });

  context("chai overrides", function() {
    beforeEach(function() {
      return this.$body = cy.$$("body");
    });

    describe("#contain", function() {
      it("can find input type submit by value", function() {
        const $input = cy.$$("<input type='submit' value='click me' />").appendTo(this.$body);

        return cy.get("input[type=submit]").should("contain", "click me");
      });

      it("is true when element contains text", () => cy.get("div").should("contain", "Nested Find"));

      it("calls super when not DOM element", () => cy.noop("foobar").should("contain", "oob"));

      //# https://github.com/cypress-io/cypress/issues/3549
      it("is true when DOM el and not jQuery el contains text", () =>
        cy.get("div").then($el => cy.wrap($el[1]).should("contain", "Nested Find"))
      );

      return it("escapes quotes", function() {
        const $span = "<span id=\"escape-quotes\">shouldn't and can\"t</span>";

        cy.$$($span).appendTo(cy.$$("body"));

        return cy.get("#escape-quotes").should("contain", "shouldn't");
      });
    });

    describe("#match", function() {
      it("calls super when provided a regex", () => expect("foo").to.match(/foo/));

      it("throws when not provided a regex", function() {
        const fn = () => expect("foo").to.match("foo");

        return expect(fn).to.throw("'match' requires its argument be a 'RegExp'. You passed: 'foo'");
      });

      it("throws with cy.should", function(done) {
        cy.on("fail", function(err) {
          expect(err.message).to.eq("'match' requires its argument be a 'RegExp'. You passed: 'bar'");
          return done();
        });

        return cy.noop("foo").should("match", "bar");
      });

      return it("does not affect DOM element matching", () => cy.get("body").should("match", "body"));
    });

    describe("#exist", () =>
      it("uses $el.selector in expectation", function(done) {
        cy.on("log:added", function(attrs, log) {
          if (attrs.name === "assert") {
            cy.removeAllListeners("log:added");

            expect(log.get("message")).to.eq("expected **#does-not-exist** not to exist in the DOM");
            return done();
          }
        });

        return cy.get("#does-not-exist").should("not.exist");
      })
    );

    describe("#be.visible", function() {
      it("sets type to child", function(done) {
        cy.on("log:added", function(attrs, log) {
          if (attrs.name === "assert") {
            cy.removeAllListeners("log:added");

            expect(log.get("type")).to.eq("child");
            return done();
          }
        });

        return cy
          .get("body")
          .get("button").should("be.visible");
      });

      return it('jquery wrapping els and selectors, not changing subject', function() {
        cy.wrap(cy.$$('<div></div>').appendTo('body')).should('not.be.visible');
        cy.wrap(cy.$$('<div></div>')).should('not.exist');
        cy.wrap(cy.$$('<div></div>').appendTo('body')).should('not.be.visible').should('exist');
        cy.wrap(cy.$$('.non-existent')).should('not.be.visible').should('not.exist');
        cy.wrap(cy.$$('.non-existent')).should('not.exist');
        return cy.wrap(cy.$$('.non-existent')).should('not.be.visible').should('not.exist');
      });
    });

    return describe("#have.length", function() {
      it("formats _obj with cypress", function(done) {
        cy.on("log:added", function(attrs, log) {
          if (attrs.name === "assert") {
            cy.removeAllListeners("log:added");

            expect(log.get("message")).to.eq("expected **<button>** to have a length of **1**");
            return done();
          }
        });

        return cy.get("button:first").should("have.length", 1);
      });

      it("formats error _obj with cypress", function(done) {
        cy.on("log:added", function(attrs, log) {
          if (attrs.name === "assert") {
            cy.removeAllListeners("log:added");

            expect(log.get("_error").message).to.eq("expected '<body>' to have a length of 2 but got 1");
            return done();
          }
        });

        return cy.get("body").should("have.length", 2);
      });

      it("does not touch non DOM objects", () => cy.noop([1,2,3]).should("have.length", 3));

      return it("rejects any element not in the document", function() {
        cy.$$("<button />").appendTo(this.$body);
        cy.$$("<button />").appendTo(this.$body);

        const buttons = cy.$$("button");

        const { length } = buttons;

        cy.on("command:retry", _.after(2, () => {
          return cy.$$("button:last").remove();
        })
        );

        return cy.wrap(buttons).should("have.length", length - 1);
      });
    });
  });

  return context("chai plugins", function() {
    beforeEach(function() {
      this.logs = [];

      this.clearLogs = () => {
        return this.logs = [];
      };

      cy.on("log:added", (attrs, log) => {
        return this.logs.push(log);
      });

      return null;
    });

    context("data", function() {
      beforeEach(function() {
        this.$div = $("<div data-foo='bar' />");
        return this.$div.data = function() { throw new Error("data called"); };
      });

      it("no prop, with prop, negation, and chainable", function() {
        expect(this.$div).to.have.data("foo"); //# 1
        expect(this.$div).to.have.data("foo", "bar"); //# 2,3
        expect(this.$div).to.have.data("foo").and.eq("bar"); //# 4,5
        expect(this.$div).to.have.data("foo").and.match(/bar/); //# 6,7
        expect(this.$div).not.to.have.data("baz"); //# 8

        return expect(this.logs.length).to.eq(8);
      });

      return it("throws when obj is not DOM", function(done) {
        cy.on("fail", err => {
          expect(this.logs.length).to.eq(1);
          expect(this.logs[0].get("error").message).to.be.ok;
          expect(err.message).to.include("> data");
          expect(err.message).to.include("> {}");

          return done();
        });

        return expect({}).to.have.data("foo");
      });
    });

    context("class", function() {
      beforeEach(function() {
        this.$div = $("<div class='foo bar' />");
        return this.$div.hasClass = function() { throw new Error("hasClass called"); };
      });

      it("class, not class", function() {
        expect(this.$div).to.have.class("foo"); //# 1
        expect(this.$div).to.have.class("bar"); //# 2
        expect(this.$div).not.to.have.class("baz"); //# 3

        expect(this.logs.length).to.eq(3);

        const l1 = this.logs[0];
        const l3 = this.logs[2];

        expect(l1.get("message")).to.eq(
          "expected **<div.foo.bar>** to have class **foo**"
        );

        return expect(l3.get("message")).to.eq(
          "expected **<div.foo.bar>** not to have class **baz**"
        );
      });

      return it("throws when obj is not DOM", function(done) {
        cy.on("fail", err => {
          expect(this.logs.length).to.eq(1);
          expect(this.logs[0].get("error").message).to.eq(
            "expected 'foo' to have class 'bar'"
          );
          expect(err.message).to.include("> class");
          expect(err.message).to.include("> foo");

          return done();
        });

        return expect("foo").to.have.class("bar");
      });
    });

    context("id", function() {
      beforeEach(function() {
        this.$div = $("<div id='foo' />");
        this.$div.prop = function() { throw new Error("prop called"); };
        this.$div.attr = function() { throw new Error("attr called"); };

        this.$div2 = $("<div />");
        this.$div2.prop("id", "foo");
        this.$div2.prop = function() { throw new Error("prop called"); };
        this.$div2.attr = function() { throw new Error("attr called"); };

        this.$div3 = $("<div />");
        this.$div3.attr("id", "foo");
        this.$div3.prop = function() { throw new Error("prop called"); };
        return this.$div3.attr = function() { throw new Error("attr called"); };
      });

      it("id, not id", function() {
        expect(this.$div).to.have.id("foo"); //# 1
        expect(this.$div).not.to.have.id("bar"); //# 2

        expect(this.$div2).to.have.id("foo"); //# 3

        expect(this.$div3).to.have.id("foo"); //# 4

        expect(this.logs.length).to.eq(4);

        const l1 = this.logs[0];
        const l2 = this.logs[1];

        expect(l1.get("message")).to.eq(
          "expected **<div#foo>** to have id **foo**"
        );

        return expect(l2.get("message")).to.eq(
          "expected **<div#foo>** not to have id **bar**"
        );
      });

      return it("throws when obj is not DOM", function(done) {
        cy.on("fail", err => {
          expect(this.logs.length).to.eq(1);
          expect(this.logs[0].get("error").message).to.eq(
            "expected [] to have id 'foo'"
          );
          expect(err.message).to.include("> id");
          expect(err.message).to.include("> []");

          return done();
        });

        return expect([]).to.have.id("foo");
      });
    });

    context("html", function() {
      beforeEach(function() {
        this.$div = $("<div><button>button</button></div>");
        return this.$div.html = function() { throw new Error("html called"); };
      });

      it("html, not html, contain html", function() {
        let err;
        expect(this.$div).to.have.html("<button>button</button>"); //# 1
        expect(this.$div).not.to.have.html("foo"); //# 2
        expect(this.logs.length).to.eq(2);

        const l1 = this.logs[0];
        const l2 = this.logs[1];

        expect(l1.get("message")).to.eq(
          "expected **<div>** to have HTML **<button>button</button>**"
        );

        expect(l2.get("message")).to.eq(
          "expected **<div>** not to have HTML **foo**"
        );

        this.clearLogs();
        expect(this.$div).to.contain.html("<button>");
        expect(this.logs[0].get('message')).to.eq(
          "expected **<div>** to contain HTML **<button>**"
        );

        this.clearLogs();
        expect(this.$div).to.not.contain.html("foo"); //# 4
        expect(this.logs[0].get('message')).to.eq(
          "expected **<div>** not to contain HTML **foo**"
        );

        this.clearLogs();
        try {
          expect(this.$div).to.have.html("<span>span</span>");
        } catch (error) {
          err = error;
          expect(this.logs[0].get("message")).to.eq(
            "expected **<div>** to have HTML **<span>span</span>**, but the HTML was **<button>button</button>**"
          );
        }

        this.clearLogs();
        try {
          return expect(this.$div).to.contain.html("<span>span</span>");
        } catch (error1) {
          err = error1;
          return expect(this.logs[0].get("message")).to.eq(
            "expected **<div>** to contain HTML **<span>span</span>**, but the HTML was **<button>button</button>**"
          );
        }
      });

      it("throws when obj is not DOM", function(done) {
        cy.on("fail", err => {
          expect(this.logs.length).to.eq(1);
          expect(this.logs[0].get("error").message).to.eq(
            "expected null to have HTML 'foo'"
          );
          expect(err.message).to.include("> html");
          expect(err.message).to.include("> null");

          return done();
        });

        return expect(null).to.have.html("foo");
      });

      return it("partial match", function() {
        expect(this.$div).to.contain.html('button');
        expect(this.$div).to.include.html('button');
        expect(this.$div).to.not.contain.html('span');
        return cy.get('button').should('contain.html', 'button');
      });
    });

    context("text", function() {
      beforeEach(function() {
        this.$div = $("<div>foo</div>");
        return this.$div.text = function() { throw new Error("text called"); };
      });

      it("text, not text, contain text", function() {
        let err;
        expect(this.$div).to.have.text("foo"); //# 1
        expect(this.$div).not.to.have.text("bar"); //# 2

        expect(this.logs.length).to.eq(2);

        const l1 = this.logs[0];
        const l2 = this.logs[1];

        expect(l1.get("message")).to.eq(
          "expected **<div>** to have text **foo**"
        );

        expect(l2.get("message")).to.eq(
          "expected **<div>** not to have text **bar**"
        );

        this.clearLogs();
        expect(this.$div).to.contain.text("f");
        expect(this.logs[0].get("message")).to.eq(
          "expected **<div>** to contain text **f**"
        );

        this.clearLogs();
        expect(this.$div).to.not.contain.text("foob");
        expect(this.logs[0].get("message")).to.eq(
          "expected **<div>** not to contain text **foob**"
        );

        this.clearLogs();
        try {
          expect(this.$div).to.have.text("bar");
        } catch (error) {
          err = error;
          expect(this.logs[0].get("message")).to.eq(
            "expected **<div>** to have text **bar**, but the text was **foo**"
          );
        }

        this.clearLogs();
        try {
          return expect(this.$div).to.contain.text("bar");
        } catch (error1) {
          err = error1;
          return expect(this.logs[0].get("message")).to.eq(
            "expected **<div>** to contain text **bar**, but the text was **foo**"
          );
        }
      });

      it("partial match", function() {
        expect(this.$div).to.have.text('foo');
        expect(this.$div).to.contain.text('o');
        expect(this.$div).to.include.text('o');
        cy.get('div').should('contain.text', 'iv').should('contain.text', 'd');
        return cy.get('div').should('not.contain.text', 'fizzbuzz').should('contain.text', 'Nest');
      });

      return it("throws when obj is not DOM", function(done) {
        cy.on("fail", err => {
          expect(this.logs.length).to.eq(1);
          expect(this.logs[0].get("error").message).to.eq(
            "expected undefined to have text 'foo'"
          );
          expect(err.message).to.include("> text");
          expect(err.message).to.include("> undefined");

          return done();
        });

        return expect(undefined).to.have.text("foo");
      });
    });

    context("value", function() {
      beforeEach(function() {
        this.$input = $("<input value='foo' />");
        return this.$input.val = function() { throw new Error("val called"); };
      });

      it("value, not value, contain value", function() {
        let err;
        expect(this.$input).to.have.value("foo"); //# 1
        expect(this.$input).not.to.have.value("bar"); //# 2

        expect(this.logs.length).to.eq(2);

        const l1 = this.logs[0];
        const l2 = this.logs[1];

        expect(l1.get("message")).to.eq(
          "expected **<input>** to have value **foo**"
        );

        expect(l2.get("message")).to.eq(
          "expected **<input>** not to have value **bar**"
        );

        this.clearLogs();
        expect(this.$input).to.contain.value("foo");
        expect(this.logs[0].get("message")).to.eq(
          "expected **<input>** to contain value **foo**"
        );
        
        this.clearLogs();
        expect(this.$input).not.to.contain.value("bar");
        expect(this.logs[0].get("message")).to.eq(
          "expected **<input>** not to contain value **bar**"
        );

        this.clearLogs();
        try {
          expect(this.$input).to.have.value("bar");
        } catch (error) {
          err = error;
          expect(this.logs[0].get("message")).to.eq(
            "expected **<input>** to have value **bar**, but the value was **foo**"
          );
        }

        this.clearLogs();
        try {
          return expect(this.$input).to.contain.value("bar");
        } catch (error1) {
          err = error1;
          return expect(this.logs[0].get("message")).to.eq(
            "expected **<input>** to contain value **bar**, but the value was **foo**"
          );
        }
      });

      it("throws when obj is not DOM", function(done) {
        cy.on("fail", err => {
          expect(this.logs.length).to.eq(1);
          expect(this.logs[0].get("error").message).to.eq(
            "expected {} to have value 'foo'"
          );
          expect(err.message).to.include("> value");
          expect(err.message).to.include("> {}");

          return done();
        });

        return expect({}).to.have.value("foo");
      });

      return it("partial match", function() {
        expect(this.$input).to.contain.value('oo');
        expect(this.$input).to.not.contain.value('oof');
        //# make sure "includes" is an alias of "include"
        expect(this.$input).to.includes.value('oo');
        cy.get('input')
          .invoke('val','foobar')
          .should('contain.value', 'bar')
          .should('contain.value', 'foo')
          .should('include.value', 'foo');
        cy.wrap(null).then(function() {
          cy.$$('<input value="foo1">').prependTo(cy.$$('body'));
          return cy.$$('<input value="foo2">').prependTo(cy.$$('body'));
        });
        return cy.get('input').should(function($els) {
          expect($els).to.have.value('foo2');
          expect($els).to.contain.value('foo');
          return expect($els).to.include.value('foo');}).should('contain.value', 'oo2');
      });
    });

    context("descendants", function() {
      beforeEach(function() {
        this.$div = $("<div><button>button</button></div>");
        return this.$div.has = function() { throw new Error("has called"); };
      });

      it("descendants, not descendants", function() {
        expect(this.$div).to.have.descendants("button"); //# 1
        expect(this.$div).not.to.have.descendants("input"); //# 2

        expect(this.logs.length).to.eq(2);

        const l1 = this.logs[0];
        const l2 = this.logs[1];

        expect(l1.get("message")).to.eq(
          "expected **<div>** to have descendants **button**"
        );

        return expect(l2.get("message")).to.eq(
          "expected **<div>** not to have descendants **input**"
        );
      });

      return it("throws when obj is not DOM", function(done) {
        cy.on("fail", err => {
          expect(this.logs.length).to.eq(1);
          expect(this.logs[0].get("error").message).to.eq(
            "expected {} to have descendants 'foo'"
          );
          expect(err.message).to.include("> descendants");
          expect(err.message).to.include("> {}");

          return done();
        });

        return expect({}).to.have.descendants("foo");
      });
    });

    context("visible", function() {
      beforeEach(function() {
        this.$div = $("<div>div</div>").appendTo($("body"));
        this.$div.is = function() { throw new Error("is called"); };

        this.$div2 = $("<div style='display: none'>div</div>").appendTo($("body"));
        return this.$div2.is = function() { throw new Error("is called"); };
      });

      afterEach(function() {
        this.$div.remove();
        return this.$div2.remove();
      });

      it("visible, not visible, adds to error", function() {
        expect(this.$div).to.be.visible; //# 1
        expect(this.$div2).not.to.be.visible; //# 2

        expect(this.logs.length).to.eq(2);

        const l1 = this.logs[0];
        const l2 = this.logs[1];

        expect(l1.get("message")).to.eq(
          "expected **<div>** to be **visible**"
        );

        expect(l2.get("message")).to.eq(
          "expected **<div>** not to be **visible**"
        );

        try {
          return expect(this.$div2).to.be.visible;
        } catch (err) {
          const l6 = this.logs[5];

          //# the error on this log should have this message appended to it
          return expect(l6.get("error").message).to.eq(
            `\
expected '<div>' to be 'visible'

This element '<div>' is not visible because it has CSS property: 'display: none'\
`
          );
        }
      });

      return it("throws when obj is not DOM", function(done) {
        cy.on("fail", err => {
          expect(this.logs.length).to.eq(1);
          expect(this.logs[0].get("error").message).to.eq(
            "expected {} to be 'visible'"
          );
          expect(err.message).to.include("> visible");
          expect(err.message).to.include("> {}");

          return done();
        });

        return expect({}).to.be.visible;
      });
    });

    context("hidden", function() {
      beforeEach(function() {
        this.$div = $("<div style='display: none'>div</div>").appendTo($("body"));
        this.$div.is = function() { throw new Error("is called"); };

        this.$div2 = $("<div>div</div>").appendTo($("body"));
        return this.$div2.is = function() { throw new Error("is called"); };
      });

      afterEach(function() {
        this.$div.remove();
        return this.$div2.remove();
      });

      it("hidden, not hidden, adds to error", function() {
        expect(this.$div).to.be.hidden; //# 1
        expect(this.$div2).not.to.be.hidden; //# 2

        expect(this.logs.length).to.eq(2);

        const l1 = this.logs[0];
        const l2 = this.logs[1];

        expect(l1.get("message")).to.eq(
          "expected **<div>** to be **hidden**"
        );

        expect(l2.get("message")).to.eq(
          "expected **<div>** not to be **hidden**"
        );

        try {
          return expect(this.$div2).to.be.hidden;
        } catch (err) {
          const l6 = this.logs[5];

          //# the error on this log should have this message appended to it
          return expect(l6.get("error").message).to.eq("expected '<div>' to be 'hidden'");
        }
      });

      return it("throws when obj is not DOM", function(done) {
        cy.on("fail", err => {
          expect(this.logs.length).to.eq(1);
          expect(this.logs[0].get("error").message).to.eq(
            "expected {} to be 'hidden'"
          );
          expect(err.message).to.include("> hidden");
          expect(err.message).to.include("> {}");

          return done();
        });

        return expect({}).to.be.hidden;
      });
    });

    context("selected", function() {
      beforeEach(function() {
        this.$option = $("<option selected>option</option>");
        this.$option.is = function() { throw new Error("is called"); };

        this.$option2 = $("<option>option</option>");
        return this.$option2.is = function() { throw new Error("is called"); };
      });

      it("selected, not selected", function() {
        expect(this.$option).to.be.selected; //# 1
        expect(this.$option2).not.to.be.selected; //# 2

        expect(this.logs.length).to.eq(2);

        const l1 = this.logs[0];
        const l2 = this.logs[1];

        expect(l1.get("message")).to.eq(
          "expected **<option>** to be **selected**"
        );

        return expect(l2.get("message")).to.eq(
          "expected **<option>** not to be **selected**"
        );
      });

      return it("throws when obj is not DOM", function(done) {
        cy.on("fail", err => {
          expect(this.logs.length).to.eq(1);
          expect(this.logs[0].get("error").message).to.eq(
            "expected {} to be 'selected'"
          );
          expect(err.message).to.include("> selected");
          expect(err.message).to.include("> {}");

          return done();
        });

        return expect({}).to.be.selected;
      });
    });

    context("checked", function() {
      beforeEach(function() {
        this.$input = $("<input type='checkbox' checked />");
        this.$input.is = function() { throw new Error("is called"); };

        this.$input2 = $("<input type='checkbox' />");
        return this.$input2.is = function() { throw new Error("is called"); };
      });

      it("checked, not checked", function() {
        expect(this.$input).to.be.checked; //# 1
        expect(this.$input2).not.to.be.checked; //# 2

        expect(this.logs.length).to.eq(2);

        const l1 = this.logs[0];
        const l2 = this.logs[1];

        expect(l1.get("message")).to.eq(
          "expected **<input>** to be **checked**"
        );

        return expect(l2.get("message")).to.eq(
          "expected **<input>** not to be **checked**"
        );
      });

      return it("throws when obj is not DOM", function(done) {
        cy.on("fail", err => {
          expect(this.logs.length).to.eq(1);
          expect(this.logs[0].get("error").message).to.eq(
            "expected {} to be 'checked'"
          );
          expect(err.message).to.include("> checked");
          expect(err.message).to.include("> {}");

          return done();
        });

        return expect({}).to.be.checked;
      });
    });

    context("enabled", function() {
      beforeEach(function() {
        this.$input = $("<input />");
        this.$input.is = function() { throw new Error("is called"); };

        this.$input2 = $("<input disabled />");
        return this.$input2.is = function() { throw new Error("is called"); };
      });

      it("enabled, not enabled", function() {
        expect(this.$input).to.be.enabled; //# 1
        expect(this.$input2).not.to.be.enabled; //# 2

        expect(this.logs.length).to.eq(2);

        const l1 = this.logs[0];
        const l2 = this.logs[1];

        expect(l1.get("message")).to.eq(
          "expected **<input>** to be **enabled**"
        );

        return expect(l2.get("message")).to.eq(
          "expected **<input>** not to be **enabled**"
        );
      });

      return it("throws when obj is not DOM", function(done) {
        cy.on("fail", err => {
          expect(this.logs.length).to.eq(1);
          expect(this.logs[0].get("error").message).to.eq(
            "expected {} to be 'enabled'"
          );
          expect(err.message).to.include("> enabled");
          expect(err.message).to.include("> {}");

          return done();
        });

        return expect({}).to.be.enabled;
      });
    });

    context("disabled", function() {
      beforeEach(function() {
        this.$input = $("<input disabled />");
        this.$input.is = function() { throw new Error("is called"); };

        this.$input2 = $("<input />");
        return this.$input2.is = function() { throw new Error("is called"); };
      });

      it("disabled, not disabled", function() {
        expect(this.$input).to.be.disabled; //# 1
        expect(this.$input2).not.to.be.disabled; //# 2

        expect(this.logs.length).to.eq(2);

        const l1 = this.logs[0];
        const l2 = this.logs[1];

        expect(l1.get("message")).to.eq(
          "expected **<input>** to be **disabled**"
        );

        return expect(l2.get("message")).to.eq(
          "expected **<input>** not to be **disabled**"
        );
      });

      return it("throws when obj is not DOM", function(done) {
        cy.on("fail", err => {
          expect(this.logs.length).to.eq(1);
          expect(this.logs[0].get("error").message).to.eq(
            "expected {} to be 'disabled'"
          );
          expect(err.message).to.include("> disabled");
          expect(err.message).to.include("> {}");

          return done();
        });

        return expect({}).to.be.disabled;
      });
    });

    context("exist", () =>
      it("passes thru non DOM", function() {
        expect([]).to.exist;
        expect({}).to.exist;
        expect('foo').to.exist;

        expect(this.logs.length).to.eq(3);

        const l1 = this.logs[0];
        const l2 = this.logs[1];
        const l3 = this.logs[2];

        expect(l1.get("message")).to.eq(
          "expected **[]** to exist"
        );

        expect(l2.get("message")).to.eq(
          "expected **{}** to exist"
        );

        return expect(l3.get("message")).to.eq(
          "expected **foo** to exist"
        );
      })
    );

    context("empty", function() {
      beforeEach(function() {
        this.div = $("<div></div>");
        this.div.is = function() { throw new Error("is called"); };

        this.div2 = $("<div><button>button</button></div>");
        return this.div2.is = function() { throw new Error("is called"); };
      });

      it("passes thru non DOM", function() {
        expect([]).to.be.empty;
        expect({}).to.be.empty;
        expect('').to.be.empty;

        expect(this.logs.length).to.eq(3);

        const l1 = this.logs[0];
        const l2 = this.logs[1];
        const l3 = this.logs[2];

        expect(l1.get("message")).to.eq(
          "expected **[]** to be empty"
        );

        expect(l2.get("message")).to.eq(
          "expected **{}** to be empty"
        );

        return expect(l3.get("message")).to.eq(
          "expected **''** to be empty"
        );
      });

      return it("empty, not empty, raw dom documents", function() {
        expect(this.div).to.be.empty; //# 1
        expect(this.div2).not.to.be.empty; //# 2

        expect(this.div.get(0)).to.be.empty; //# 3
        expect(this.div2.get(0)).not.to.be.empty; //# 4

        expect(this.logs.length).to.eq(4);

        const l1 = this.logs[0];
        const l2 = this.logs[1];
        const l3 = this.logs[2];
        const l4 = this.logs[3];

        expect(l1.get("message")).to.eq(
          "expected **<div>** to be **empty**"
        );

        expect(l2.get("message")).to.eq(
          "expected **<div>** not to be **empty**"
        );

        expect(l3.get("message")).to.eq(
          "expected **<div>** to be **empty**"
        );

        return expect(l4.get("message")).to.eq(
          "expected **<div>** not to be **empty**"
        );
      });
    });

    context("focused", function() {
      beforeEach(function() {
        this.div = $("<div id='div' tabindex=0></div>").appendTo($('body'));
        this.div.is = function() { throw new Error("is called"); };

        this.div2 = $("<div id='div2' tabindex=1><button>button</button></div>").appendTo($('body'));
        return this.div2.is = function() { throw new Error("is called"); };
      });

      it("focus, not focus, raw dom documents", function() {
        expect(this.div).to.not.be.focused;
        expect(this.div[0]).to.not.be.focused;
        this.div.focus();
        expect(this.div).to.be.focused;
        expect(this.div[0]).to.be.focused;

        this.div.blur();
        expect(this.div).to.not.be.focused;
        expect(this.div[0]).to.not.be.focused;


        expect(this.div2).not.to.be.focused;
        expect(this.div2[0]).not.to.be.focused;
        this.div.focus();
        expect(this.div2).not.to.be.focused;
        this.div2.focus();
        expect(this.div2).to.be.focused;

        expect(this.logs.length).to.eq(10);

        const l1 = this.logs[0];
        const l2 = this.logs[1];
        const l3 = this.logs[2];
        const l4 = this.logs[3];

        expect(l1.get("message")).to.eq(
          "expected **<div#div>** not to be **focused**"
        );

        expect(l2.get("message")).to.eq(
          "expected **<div#div>** not to be **focused**"
        );

        expect(l3.get("message")).to.eq(
          "expected **<div#div>** to be **focused**"
        );

        return expect(l4.get("message")).to.eq(
          "expected **<div#div>** to be **focused**"
        );
      });

      it("works with focused or focus", function() {
        expect(this.div).to.not.have.focus;
        expect(this.div).to.not.have.focused;
        expect(this.div).to.not.be.focus;
        expect(this.div).to.not.be.focused;

        cy.get('#div').should('not.be.focused');
        return cy.get('#div').should('not.have.focus');
      });

      it("works with multiple elements", function() {
        cy.get('div:last').focus();
        cy.get('div').should('have.focus');
        cy.get('div:last').blur();
        return cy.get('div').should('not.have.focus');
      });

      it("throws when obj is not DOM", function(done) {
        cy.on("fail", err => {
          expect(this.logs.length).to.eq(1);
          expect(this.logs[0].get("error").message).to.contain(
            "expected {} to be 'focused'"
          );
          expect(err.message).to.include("> focus");
          expect(err.message).to.include("> {}");

          return done();
        });

        return expect({}).to.have.focus;
      });

      return it("calls into custom focus pseudos", function() {
        cy.$$('button:first').focus();
        const stub = cy.spy($.expr.pseudos, 'focus').as('focus');
        expect(cy.$$('button:first')).to.have.focus;
        return cy.get('button:first').should('have.focus')
          .then(() => expect(stub).to.be.calledTwice);
      });
    });

    context("match", function() {
      beforeEach(function() {
        this.div = $("<div></div>");
        return this.div.is = function() { throw new Error("is called"); };
      });

      it("passes thru non DOM", function() {
        expect('foo').to.match(/f/);

        expect(this.logs.length).to.eq(1);

        const l1 = this.logs[0];

        return expect(l1.get("message")).to.eq(
          "expected **foo** to match /f/"
        );
      });

      return it("match, not match, raw dom documents", function() {
        expect(this.div).to.match("div"); //# 1
        expect(this.div).not.to.match("button"); //# 2

        expect(this.div.get(0)).to.match("div"); //# 3
        expect(this.div.get(0)).not.to.match("button"); //# 4

        expect(this.logs.length).to.eq(4);

        const l1 = this.logs[0];
        const l2 = this.logs[1];
        const l3 = this.logs[2];
        const l4 = this.logs[3];

        expect(l1.get("message")).to.eq(
          "expected **<div>** to match **div**"
        );

        expect(l2.get("message")).to.eq(
          "expected **<div>** not to match **button**"
        );

        expect(l3.get("message")).to.eq(
          "expected **<div>** to match **div**"
        );

        return expect(l4.get("message")).to.eq(
          "expected **<div>** not to match **button**"
        );
      });
    });

    context("contain", () =>
      it("passes thru non DOM", function() {
        expect(['foo']).to.contain('foo'); //# 1
        expect({foo: 'bar', baz: "quux"}).to.contain({foo: "bar"}); //# 2, 3
        expect('foo').to.contain('fo'); //# 4

        expect(this.logs.length).to.eq(4);

        const l1 = this.logs[0];
        const l2 = this.logs[1];
        const l3 = this.logs[2];
        const l4 = this.logs[3];

        expect(l1.get("message")).to.eq(
          "expected **[ foo ]** to include **foo**"
        );

        expect(l2.get("message")).to.eq(
          "expected **{ foo: bar, baz: quux }** to have a property **foo**"
        );

        expect(l3.get("message")).to.eq(
          "expected **{ foo: bar, baz: quux }** to have a property **foo** of **bar**"
        );

        return expect(l4.get("message")).to.eq(
          "expected **foo** to include **fo**"
        );
      })
    );

    context("attr", function() {
      beforeEach(function() {
        this.$div = $("<div foo='bar'>foo</div>");
        this.$div.attr = function() { throw new Error("attr called"); };

        this.$a = $("<a href='https://google.com'>google</a>");
        return this.$a.attr = function() { throw new Error("attr called"); };
      });

      it("attr, not attr", function() {
        expect(this.$div).to.have.attr("foo"); //# 1
        expect(this.$div).to.have.attr("foo", "bar"); //# 2
        expect(this.$div).not.to.have.attr("bar"); //# 3
        expect(this.$div).not.to.have.attr("bar", "baz"); //# 4
        expect(this.$div).not.to.have.attr("foo", "baz"); //# 5

        expect(this.$a).to.have.attr("href").and.match(/google/); //# 6, 7
        expect(this.$a)
        .to.have.attr("href", "https://google.com") //# 8
        .and.have.text("google"); //# 9

        try {
          expect(this.$a).not.to.have.attr("href", "https://google.com"); //# 10
        } catch (error) {}

        expect(this.logs.length).to.eq(10);

        const l1 = this.logs[0];
        const l2 = this.logs[1];
        const l3 = this.logs[2];
        const l4 = this.logs[3];
        const l5 = this.logs[4];
        const l6 = this.logs[5];
        const l7 = this.logs[6];
        const l8 = this.logs[7];
        const l9 = this.logs[8];
        const l10 = this.logs[9];

        expect(l1.get("message")).to.eq(
          "expected **<div>** to have attribute **foo**"
        );

        expect(l2.get("message")).to.eq(
          "expected **<div>** to have attribute **foo** with the value **bar**"
        );

        expect(l3.get("message")).to.eq(
          "expected **<div>** not to have attribute **bar**"
        );

        expect(l4.get("message")).to.eq(
          "expected **<div>** not to have attribute **bar**"
        );

        expect(l5.get("message")).to.eq(
          "expected **<div>** not to have attribute **foo** with the value **baz**"
        );

        expect(l6.get("message")).to.eq(
          "expected **<a>** to have attribute **href**"
        );

        expect(l7.get("message")).to.eq(
          "expected **https://google.com** to match /google/"
        );

        expect(l8.get("message")).to.eq(
          "expected **<a>** to have attribute **href** with the value **https://google.com**"
        );

        expect(l9.get("message")).to.eq(
          "expected **<a>** to have text **google**"
        );

        return expect(l10.get("message")).to.eq(
          "expected **<a>** not to have attribute **href** with the value **https://google.com**, but the value was **https://google.com**"
        );
      });

      return it("throws when obj is not DOM", function(done) {
        cy.on("fail", err => {
          expect(this.logs.length).to.eq(1);
          expect(this.logs[0].get("error").message).to.eq(
            "expected {} to have attribute 'foo'"
          );
          expect(err.message).to.include("> attr");
          expect(err.message).to.include("> {}");

          return done();
        });

        return expect({}).to.have.attr("foo");
      });
    });

    context("prop", function() {
      beforeEach(function() {
        this.$input = $("<input type='checkbox' />");
        this.$input.prop("checked", true);
        this.$input.prop = function() { throw new Error("prop called"); };

        this.$a = $("<a href='/foo'>google</a>");
        return this.$a.prop = function() { throw new Error("prop called"); };
      });

      it("prop, not prop", function() {
        expect(this.$input).to.have.prop("checked"); //# 1
        expect(this.$input).to.have.prop("checked", true); //# 2
        expect(this.$input).not.to.have.prop("bar"); //# 3
        expect(this.$input).not.to.have.prop("bar", "baz"); //# 4
        expect(this.$input).not.to.have.prop("checked", "baz"); //# 5

        const href = window.location.origin + "/foo";

        expect(this.$a).to.have.prop("href").and.match(/foo/); //# 6, 7
        expect(this.$a)
        .to.have.prop("href", href) //# 8
        .and.have.text("google"); //# 9

        try {
          expect(this.$a).not.to.have.prop("href", href); //# 10
        } catch (error) {}

        expect(this.logs.length).to.eq(10);

        const l1 = this.logs[0];
        const l2 = this.logs[1];
        const l3 = this.logs[2];
        const l4 = this.logs[3];
        const l5 = this.logs[4];
        const l6 = this.logs[5];
        const l7 = this.logs[6];
        const l8 = this.logs[7];
        const l9 = this.logs[8];
        const l10 = this.logs[9];

        expect(l1.get("message")).to.eq(
          "expected **<input>** to have property **checked**"
        );

        expect(l2.get("message")).to.eq(
          "expected **<input>** to have property **checked** with the value **true**"
        );

        expect(l3.get("message")).to.eq(
          "expected **<input>** not to have property **bar**"
        );

        expect(l4.get("message")).to.eq(
          "expected **<input>** not to have property **bar**"
        );

        expect(l5.get("message")).to.eq(
          "expected **<input>** not to have property **checked** with the value **baz**"
        );

        expect(l6.get("message")).to.eq(
          "expected **<a>** to have property **href**"
        );

        expect(l7.get("message")).to.eq(
          `expected **${href}** to match /foo/`
        );

        expect(l8.get("message")).to.eq(
          `expected **<a>** to have property **href** with the value **${href}**`
        );

        expect(l9.get("message")).to.eq(
          "expected **<a>** to have text **google**"
        );

        return expect(l10.get("message")).to.eq(
          `expected **<a>** not to have property **href** with the value **${href}**, but the value was **${href}**`
        );
      });

      return it("throws when obj is not DOM", function(done) {
        cy.on("fail", err => {
          expect(this.logs.length).to.eq(1);
          expect(this.logs[0].get("error").message).to.eq(
            "expected {} to have property 'foo'"
          );
          expect(err.message).to.include("> prop");
          expect(err.message).to.include("> {}");

          return done();
        });

        return expect({}).to.have.prop("foo");
      });
    });

    return context("css", function() {
      beforeEach(function() {
        this.$div = $("<div style='display: none'>div</div>");
        return this.$div.css = function() { throw new Error("css called"); };
      });

      it("css, not css", function() {
        expect(this.$div).to.have.css("display"); //# 1
        expect(this.$div).to.have.css("display", "none"); //# 2
        expect(this.$div).not.to.have.css("bar"); //# 3
        expect(this.$div).not.to.have.css("bar", "baz"); //# 4
        expect(this.$div).not.to.have.css("display", "inline"); //# 5

        try {
          expect(this.$div).not.to.have.css("display", "none"); //# 6
        } catch (error) {}

        expect(this.logs.length).to.eq(6);

        const l1 = this.logs[0];
        const l2 = this.logs[1];
        const l3 = this.logs[2];
        const l4 = this.logs[3];
        const l5 = this.logs[4];
        const l6 = this.logs[5];

        expect(l1.get("message")).to.eq(
          "expected **<div>** to have CSS property **display**"
        );

        expect(l2.get("message")).to.eq(
          "expected **<div>** to have CSS property **display** with the value **none**"
        );

        expect(l3.get("message")).to.eq(
          "expected **<div>** not to have CSS property **bar**"
        );

        expect(l4.get("message")).to.eq(
          "expected **<div>** not to have CSS property **bar**"
        );

        expect(l5.get("message")).to.eq(
          "expected **<div>** not to have CSS property **display** with the value **inline**"
        );

        return expect(l6.get("message")).to.eq(
          "expected **<div>** not to have CSS property **display** with the value **none**, but the value was **none**"
        );
      });

      return it("throws when obj is not DOM", function(done) {
        cy.on("fail", err => {
          expect(this.logs.length).to.eq(1);
          expect(this.logs[0].get("error").message).to.eq(
            "expected {} to have CSS property 'foo'"
          );
          expect(err.message).to.include("> css");
          expect(err.message).to.include("> {}");

          return done();
        });

        return expect({}).to.have.css("foo");
      });
    });
  });
});
