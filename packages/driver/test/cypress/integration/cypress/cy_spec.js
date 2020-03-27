/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const $ = Cypress.$.bind(Cypress);
const {
  _
} = Cypress;

describe("driver/src/cypress/cy", function() {
  before(() => cy
    .visit("/fixtures/dom.html")
    .then(function(win) {
      return this.body = win.document.body.outerHTML;
  }));

  beforeEach(function() {
    const doc = cy.state("document");

    return $(doc.body).empty().html(this.body);
  });

  context("hard deprecated private props", function() {
    it("throws on accessing props", function() {
      const fn = () => cy.props.foo;

      expect(fn).to.throw('You are accessing a private property');
      return expect(fn).to.throw('function: `cy.state\(\.\.\.\)`');
    });

    return it("throws on accessing privates", function() {
      const fn = () => cy.privates.foo;

      expect(fn).to.throw('You are accessing a private property');
      return expect(fn).to.throw('function: `cy.state\(\.\.\.\)`');
    });
  });

  context("internals of custom commands", function() {
    beforeEach(function() {
      return this.setup = function(fn = function() {}) {
        Cypress.Commands.add("nested", () => {
          return cy.url();
        });

        return cy
          .nested()
          .noop()
          .then(() => fn());
      };
    });

    it("ensures to splice queue correctly on first custom command", function() {
      Cypress.Commands.add("login", email => cy.get("input:first").type("foo"));

      const existing = cy.queue.names();

      return cy.login().noop().then(() => expect(cy.queue.names()).to.deep.eq(
        existing.concat(["login", "get", "type", "noop", "then"])
      ));
    });

    it("queues in the correct order", function() {
      const existing = cy.queue.names();

      return this.setup(() => expect(cy.queue.names()).to.deep.eq(
        existing.concat(["nested", "url", "noop", "then"])
      ));
    });

    it("nested command should reference url as next property", function() {
      return this.setup(function() {
        const nested = cy.queue.find({ name: "nested" });
        return expect(nested.get("next").get("name")).to.eq("url");
      });
    });

    it("null outs nestedIndex prior to restoring", function(done) {
      cy.on("command:queue:end", function() {
        expect(cy.state("nestedIndex")).to.be.null;
        return done();
      });

      return this.setup();
    });

    it("can recursively nest", function() {
      Cypress.Commands.add("nest1", () => cy.nest2());

      Cypress.Commands.add("nest2", () => cy.noop());

      const existing = cy.queue.names();

      return cy
        .nest1()
        .then(() => expect(cy.queue.names()).to.deep.eq(
        existing.concat(["nest1", "nest2", "noop", "then"])
      ));
    });

    return it("works with multiple nested commands", function() {
      Cypress.Commands.add("multiple", () => cy
        .url()
        .location()
        .noop());

      const existing = cy.queue.names();

      return cy
        .multiple()
        .then(() => expect(cy.queue.names()).to.deep.eq(
        existing.concat(["multiple", "url", "location", "noop", "then"])
      ));
    });
  });

  context("custom commands", function() {
    beforeEach(function() {
      Cypress.Commands.add("dashboard.selectRenderer", () => {
        return cy
          .get("[contenteditable]")
          .first();
      });

      return Cypress.Commands.add("login", {prevSubject: true}, (subject, email) => {
        return cy
          .wrap(subject.find("input:first"))
          .type(email);
      });
    });

    it("works with custom commands", function() {
      const input = cy.$$("input:first");

      return cy
        .get("input:first")
        .parent()
        .command("login", "brian@foo.com").then($input => expect($input.get(0)).to.eq(input.get(0)));
    });

    it("works with namespaced commands", function() {
      const ce = cy.$$("[contenteditable]").first();

      return cy
        .command("dashboard.selectRenderer").then($ce => expect($ce.get(0)).to.eq(ce.get(0)));
    });

    describe("parent commands", () => it("ignores existing subject", function() {
      Cypress.Commands.add("bar", (arg1, arg2) => [arg1, arg2]);

      return cy.wrap("foo").bar(1, 2).then(arr => expect(arr).to.deep.eq([1, 2]));
    }));

    describe("child commands", function() {
      beforeEach(function() {
        Cypress.Commands.add("c", {prevSubject: true}, (subject, arg) => cy.wrap([subject, arg]));

        Cypress.Commands.add("c2", {prevSubject: true},  (subject, arg) => [subject, arg]);

        Cypress.Commands.add("winOnly", { prevSubject: "window" }, function() {});

        Cypress.Commands.add("docOnly", { prevSubject: "document" }, function() {});

        Cypress.Commands.add("elOnly", { prevSubject: "element" }, function() {});

        return Cypress.Commands.add("elWinOnly", { prevSubject: ["element", "window"] }, function() {});
      });

      it("is called with the correct ctx", function() {
        const ctx = this;
        let expected = false;

        Cypress.Commands.add("childCtx", { prevSubject: true }, function() {
          expect(this === ctx).to.be.true;
          return expected = true;
        });

        return cy.wrap(null).childCtx().then(() => expect(expected).to.be.true);
      });

      it("inherits subjects", () => cy
        .wrap("foo")
        .c("bar")
        .then(function(arr) {
          expect(arr).to.deep.eq(["foo", "bar"]);

          return null;}).c("baz")
        .then(arr => expect(arr).to.deep.eq([null, "baz"])).wrap("foo2")
        .c2("bar2")
        .then(function(arr) {
          expect(arr).to.deep.eq(["foo2", "bar2"]);

          return null;}).c("baz2")
        .then(arr => expect(arr).to.deep.eq([null, "baz2"])));

      it("fails when calling child command before parent", function(done) {
        cy.on("fail", function(err) {
          expect(err.message).to.include("Oops, it looks like you are trying to call a child command before running a parent command");
          expect(err.message).to.include("cy.c()");
          return done();
        });

        cy.wrap("foo");
        return cy.c();
      });

      it("fails when calling child command before parent with arguments", function(done) {
        cy.on("fail", function(err) {
          expect(err.message).to.include("Oops, it looks like you are trying to call a child command before running a parent command");
          expect(err.message).to.include("cy.c(\"bar\")");
          return done();
        });

        cy.wrap("foo");
        return cy.c("bar");
      });

      it("fails when previous subject becomes detached", function(done) {
        cy.$$("#button").click(function() {
          return $(this).remove();
        });

        cy.on("fail", function(err) {
          expect(err.message).to.include("`cy.parent()` failed because this element is detached from the DOM.");
          expect(err.message).to.include('<button id="button">button</button>');
          expect(err.message).to.include("> `cy.click()`");
          expect(err.docsUrl).to.eq("https://on.cypress.io/element-has-detached-from-dom");
          return done();
        });

        return cy.get("#button").click().parent();
      });

      it("fails when previous subject isnt window", function(done) {
        cy.on("fail", function(err) {
          expect(err.message).to.include("`cy.winOnly()` failed because it requires the subject be a global `window` object.");
          expect(err.message).to.include("{foo: bar}");
          expect(err.message).to.include("> `cy.wrap()`");
          return done();
        });

        return cy.wrap({foo: 'bar'}).winOnly();
      });

      it("fails when previous subject isnt document", function(done) {
        cy.on("fail", function(err) {
          expect(err.message).to.include("`cy.docOnly()` failed because it requires the subject be a global `document` object.");
          expect(err.message).to.include("[1, 2, 3]");
          expect(err.message).to.include("> `cy.wrap()`");
          return done();
        });

        return cy.wrap([1,2,3]).docOnly();
      });

      return it("fails when previous subject isnt an element or window", function(done) {
        let firstPassed = false;

        cy.on("fail", function(err) {
          expect(firstPassed).to.be.true;
          expect(err.message).to.include("`cy.elWinOnly()` failed because it requires a DOM element.");
          expect(err.message).to.include("string");
          expect(err.message).to.include("> `cy.wrap()`");
          expect(err.message).to.include("All 2 subject validations failed");
          return done();
        });

        return cy.window().elWinOnly()
        .then(function() {
          firstPassed = true;

          return cy.wrap("string").elWinOnly();
        });
      });
    });

    return describe("dual commands", function() {
      beforeEach(() => Cypress.Commands.add("d", {prevSubject: "optional"}, (subject, arg) => {
        return cy.wrap([subject, arg]);
      }));

      it("passes on subject when used as a child", () => cy
        .wrap("foo")
        .d("bar")
        .then(arr => expect(arr).to.deep.eq(["foo", "bar"])));

      it("has an undefined subject when used as a parent", () => cy
        .d("bar")
        .then(arr => expect(arr).to.deep.eq([undefined, "bar"])));

      return it("has an undefined subject as a parent with a previous parent", function() {
        cy.wrap("foo");
        return cy
          .d("bar")
          .then(arr => expect(arr).to.deep.eq([undefined, "bar"])).wrap("foo")
          .d("bar")
          .then(function(arr) {
            expect(arr).to.deep.eq(["foo", "bar"]);

            return null;}).d("baz")
          .then(arr => expect(arr).to.deep.eq([null, "baz"]));
      });
    });
  });

  return context("overwrite custom commands", function() {
    beforeEach(function() {
      Cypress.Commands.overwrite("wrap", (orig, arg1) => orig("foo" + arg1));

      Cypress.Commands.overwrite("first", function(orig, subject) {
        subject = $([1, 2]);

        return orig(subject);
      });

      Cypress.Commands.overwrite("noop", function(orig, fn) {
        //# yield the context
        return fn(this);
      });

      return Cypress.Commands.overwrite("submit", (orig, subject) => orig(subject, { foo: "foo" }));
    });

    it("can modify parent commands", () => cy.wrap("bar").then(str => expect(str).to.eq("foobar")));

    it("can modify child commands", () => cy.get("li").first().then(el => expect(el[0]).to.eq(1)));

    it("has the current runnable ctx", function() {
      const _this = this;

      return cy.noop(ctx => expect(_this === ctx).to.be.true);
    });

    it("overwrites only once", function() {
      Cypress.Commands.overwrite("wrap", (orig, arg1) => orig(arg1 + "baz"));

      return cy.wrap("bar").should("eq", "barbaz");
    });

    it("errors when command does not exist", function() {
      const fn = () => Cypress.Commands.overwrite("foo", function() {});

      expect(fn).to.throw().with.property("message")
        .and.include("Cannot overwite command for: `foo`. An existing command does not exist by that name.");
      return expect(fn).to.throw().with.property("docsUrl")
        .and.include("https://on.cypress.io/api");
    });

    return it("updates state('current') with modified args", () => cy.get("form").eq(0).submit().then(() => {
      return expect(cy.state("current").get("prev").get("args")[0].foo).to.equal("foo");
    }));
  });
});
