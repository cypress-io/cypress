/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const $ = Cypress.$.bind(Cypress);
const {
  _
} = Cypress;
const {
  Promise
} = Cypress;

describe("src/cy/commands/actions/submit", function() {
  before(() => cy
    .visit("/fixtures/dom.html")
    .then(function(win) {
      return this.body = win.document.body.outerHTML;
  }));

  beforeEach(function() {
    const doc = cy.state("document");

    return $(doc.body).empty().html(this.body);
  });

  return context("#submit", function() {
    it("does not change the subject when default actions is prevented", function() {
      const form = cy.$$("form:first").on("submit", () => false);

      return cy.get("form:first").submit().then($form => expect($form.get(0)).to.eq(form.get(0)));
    });

    it("works with native event listeners", function() {
      let submitted = false;

      cy.$$("form:first").get(0).addEventListener("submit", () => submitted = true);

      return cy.get("form:first").submit().then(() => expect(submitted).to.be.true);
    });

    it("bubbles up to the window", function() {
      let onsubmitCalled = false;

      return cy
        .window().then(win => win.onsubmit = () => onsubmitCalled = true).get("form:first").submit().then(() => expect(onsubmitCalled).to.be.true);
    });

    it("does not submit the form action is prevented default", function(done) {
      cy.$$("form:first").parent().on("submit", e => e.preventDefault());

      return cy
        .window()
        .then(win => {
          const $win = $(win);
          //# if we reach beforeunload we know the form
          //# has been submitted

          $win.on("beforeunload", function() {
            done(new Error("submit event should not submit the form."));

            return undefined;
          });

          return cy.get("form:first").submit().then(function() {
            $win.off("beforeunload");

            return done();
          });
      });
    });

    it("does not submit the form action returned false", function(done) {
      cy.$$("form:first").parent().on("submit", e => false);

      return cy
        .window()
        .then(win => {
          const $win = $(win);
          //# if we reach beforeunload we know the form
          //# has been submitted

          $win.on("beforeunload", function() {
            done("submit event should not submit the form.");

            return undefined;
          });

          return cy.get("form:first").submit().then(function() {
            $win.off("beforeunload");

            return done();
          });
      });
    });

    it("actually submits the form.", function() {
      let beforeunload = false;

      return cy
        .window().then(win => {
          //# if we reach beforeunload we know the form
          //# has been submitted
          return $(win).on("beforeunload", function() {
            beforeunload = true;

            return undefined;
          });
      }).get("form:first").submit().then(() => expect(beforeunload).to.be.true);
    });

    //# if we removed our submit handler this would fail.
    it("fires 'form:submitted event'", function() {
      const $form = cy.$$("form:first");
      //# we must rely on isReady already being pending here
      //# because the submit method does not trigger beforeunload
      //# synchronously.

      let submitted = false;

      cy.on("form:submitted", function(e) {
        submitted = true;
        return expect(e.target).to.eq($form.get(0));
      });

      return cy.get("form:first").submit().then(() => expect(submitted).to.be.true);
    });

    it("does not fire 'form:submitted' if default action is prevented", function() {
      let submitted = false;

      cy.on("form:submitted", e => submitted = true);

      cy.$$("form:first").on("submit", e => e.preventDefault());

      return cy
        .get("form:first").submit().then(() => expect(submitted).to.be.false);
    });

    it("delays 50ms before resolving", function() {
      cy.$$("form:first").on("submit", e => {
        return cy.spy(Promise, "delay");
      });

      return cy.get("form:first").submit().then(() => expect(Promise.delay).to.be.calledWith(50, "submit"));
    });

    it("increases the timeout delta", function() {
      cy.spy(cy, "timeout");

      return cy.get("form:first").submit().then(() => expect(cy.timeout).to.be.calledWith(50, true));
    });

    describe("assertion verification", function() {
      beforeEach(function() {
        cy.on("log:added", (attrs, log) => {
          if (log.get("name") === "assert") {
            return this.lastLog = log;
          }
        });

        return null;
      });

      return it("eventually passes the assertion", function() {
        cy.$$("form:first").submit(function() {
          _.delay(() => {
            return $(this).addClass("submitted");
          }
          , 100);

          return false;
        });

        return cy.get("form:first").submit().should("have.class", "submitted").then(function() {
          const {
            lastLog
          } = this;

          expect(lastLog.get("name")).to.eq("assert");
          expect(lastLog.get("state")).to.eq("passed");
          return expect(lastLog.get("ended")).to.be.true;
        });
      });
    });

    describe("errors", function() {
      beforeEach(function() {
        Cypress.config("defaultCommandTimeout", 100);

        this.logs = [];

        cy.on("log:added", (attrs, log) => {
          this.lastLog = log;
          return this.logs.push(log);
        });

        return null;
      });

      it("is a child command", function(done) {
        cy.on("fail", () => done());

        return cy.submit();
      });

      it("throws when non dom subject", function(done) {
        cy.on("fail", () => done());

        return cy.noop({}).submit();
      });

      it("throws when subject isnt a form", function(done) {
        cy.on("fail", err => {
          const {
            lastLog
          } = this;

          expect(this.logs.length).to.eq(2);
          expect(lastLog.get("error")).to.eq(err);
          expect(err.message).to.include("`cy.submit()` can only be called on a `<form>`. Your subject contains a: `<input id=\"input\">`");
          expect(err.docsUrl).to.eq("https://on.cypress.io/submit");
          return done();
        });

        return cy.get("input").submit();
      });

      it("throws when subject is not in the document", function(done) {
        let submitted = 0;

        var form = cy.$$("form:first").submit(function(e) {
          submitted += 1;
          form.remove();
          return false;
        });

        cy.on("fail", function(err) {
          expect(submitted).to.eq(1);
          expect(err.message).to.include("`cy.submit()` failed because this element");
          return done();
        });

        return cy.get("form:first").submit().submit();
      });

      it("throws when subject is a collection of elements", function(done) {
        const forms = cy.$$("form");

        //# make sure we have more than 1 form.
        expect(forms.length).to.be.gt(1);

        cy.on("fail", err => {
          expect(err.message).to.include(`\`cy.submit()\` can only be called on a single \`form\`. Your subject contained ${forms.length} \`form\` elements.`);
          expect(err.docsUrl).to.eq("https://on.cypress.io/submit");
          return done();
        });

        return cy.get("form").submit();
      });

      it("logs once when not dom subject", function(done) {
        cy.on("fail", err => {
          const {
            lastLog
          } = this;

          expect(this.logs.length).to.eq(1);
          expect(lastLog.get("error")).to.eq(err);
          return done();
        });

        return cy.submit();
      });

      it("eventually fails the assertion", function(done) {
        cy.$$("form:first").submit(() => false);

        cy.on("fail", err => {
          const {
            lastLog
          } = this;

          expect(err.message).to.include(lastLog.get("error").message);
          expect(err.message).not.to.include("undefined");
          expect(lastLog.get("name")).to.eq("assert");
          expect(lastLog.get("state")).to.eq("failed");
          expect(lastLog.get("error")).to.be.an.instanceof(chai.AssertionError);

          return done();
        });

        return cy.get("form:first").submit().should("have.class", "submitted");
      });

      return it("does not log an additional log on failure", function(done) {
        cy.$$("form:first").submit(() => false);

        cy.on("fail", () => {
          expect(this.logs.length).to.eq(3);
          return done();
        });

        return cy.get("form:first").submit().should("have.class", "submitted");
      });
    });

    return describe(".log", function() {
      beforeEach(function() {
        cy.on("log:added", (attrs, log) => {
          if (log.get("name") === "submit") {
            return this.lastLog = log;
          }
        });

        return null;
      });

      it("logs immediately before resolving", function() {
        const $form = cy.$$("form:first");

        cy.on("log:added", (attrs, log) => {
          if (log.get("name") === "submit") {
            expect(log.get("state")).to.eq("pending");
            return expect(log.get("$el").get(0)).to.eq($form.get(0));
          }
        });

        return cy.get("form:first").submit();
      });

      it("provides $el", function() {
        cy.$$("form:first").submit(() => false);

        return cy.get("form").first().submit().then(function($form) {
          const {
            lastLog
          } = this;

          expect(lastLog.get("name")).to.eq("submit");
          return expect(lastLog.get("$el")).to.match($form);
        });
      });

      it("snapshots before submitted", function() {
        let expected = false;

        cy.$$("form:first").submit(() => false);

        cy.$$("form").first().submit(() => {
          const {
            lastLog
          } = this;

          expected = true;

          expect(lastLog.get("snapshots").length).to.eq(1);
          expect(lastLog.get("snapshots")[0].name).to.eq("before");
          return expect(lastLog.get("snapshots")[0].body).to.be.an("object");
        });

        return cy.get("form").first().submit().then(() => expect(expected).to.be.true);
      });

      it("snapshots after submitting", function() {
        cy.$$("form:first").submit(() => false);

        return cy.get("form").first().submit().then(function($form) {
          const {
            lastLog
          } = this;

          expect(lastLog.get("snapshots").length).to.eq(2);
          expect(lastLog.get("snapshots")[1].name).to.eq("after");
          return expect(lastLog.get("snapshots")[1].body).to.be.an("object");
        });
      });

      return it("#consoleProps", function() {
        cy.$$("form:first").submit(() => false);

        return cy.get("form").first().submit().then(function($form) {
          const {
            lastLog
          } = this;

          return expect(this.lastLog.invoke("consoleProps")).to.deep.eq({
            Command: "submit",
            "Applied To": lastLog.get("$el").get(0),
            Elements: 1
          });});
    });
  });
});
});
