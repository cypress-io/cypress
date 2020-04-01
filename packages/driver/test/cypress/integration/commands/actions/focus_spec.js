/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const $ = Cypress.$.bind(Cypress);
const {
  _
} = Cypress;

const getActiveElement = () => cy.state("document").activeElement;

describe("src/cy/commands/actions/focus", function() {
  before(() => cy
    .visit("/fixtures/dom.html")
    .then(function(win) {
      return this.body = win.document.body.outerHTML;
  }));

  beforeEach(function() {
    const doc = cy.state("document");

    return $(doc.body).empty().html(this.body);
  });

  context("#focus", function() {
    it("sends a focus event",  function() {
      let focus = false;

      cy.$$("#focus input").focus(() => focus = true);

      return cy.get("#focus input").focus().then(function($input) {
        expect(focus).to.be.true;
        return expect(getActiveElement()).to.eq($input.get(0));
      });
    });

    it("bubbles focusin event",  function() {
      let focusin = false;

      cy.$$("#focus").focusin(() => focusin = true);

      return cy.get("#focus input").focus().then(() => expect(focusin).to.be.true);
    });

    it("manually blurs focused subject as a fallback", function() {
      let blurred = false;

      cy.$$("input:first").blur(() => blurred = true);

      return cy
        .get("input:first").focus()
        .get("#focus input").focus()
        .then(() => expect(blurred).to.be.true);
    });

    it("matches cy.focused()", function() {
      const button = cy.$$("#button");

      return cy
      .get("#button").focus().focused()
      .then($focused => expect($focused.get(0)).to.eq(button.get(0)));
    });

    it("returns the original subject", function() {
      const button = cy.$$("#button");

      return cy.get("#button").focus().then($button => expect($button).to.match(button));
    });

    it("causes first focused element to receive blur", function() {
      let blurred = false;

      cy.$$("input:first").blur(() => blurred = true);

      return cy
        .get("input:first").focus()
        .get("input:last").focus()
        .then(() => expect(blurred).to.be.true);
    });

    //# https://allyjs.io/data-tables/focusable.html#footnote-3
    //# body is focusable, but it will not steal focus away
    //# from another activeElement or cause any focus or blur events
    //# to fire
    it("can focus the body but does not fire focus or blur events", function() {
      let doc;
      const { body } = (doc = cy.state("document"));

      let focused = false;
      let blurred = false;

      const onFocus = () => focused = true;

      const onBlur = () => blurred = true;

      return cy
      .get("input:first").focus().then(function($input) {
        expect(doc.activeElement).to.eq($input.get(0));

        $input.get(0).addEventListener("blur", onBlur);
        body.addEventListener("focus", onFocus);

        return cy.get("body").focus().then(function() {
          //# should not have changed actual activeElement
          expect(doc.activeElement).to.eq($input.get(0));

          $input.get(0).removeEventListener("blur", onBlur);
          body.removeEventListener("focus", onFocus);

          expect(focused).to.be.false;
          return expect(blurred).to.be.false;
        });
      });
    });

    it("can focus the window but does not change activeElement or fire blur events", function() {
      const win = cy.state("window");
      const doc = cy.state("document");

      let focused = false;
      let blurred = false;

      const onFocus = () => focused = true;

      const onBlur = () => blurred = true;

      return cy
      .get("input:first").focus().then(function($input) {
        expect(doc.activeElement).to.eq($input.get(0));

        $input.get(0).addEventListener("blur", onBlur);
        win.addEventListener("focus", onFocus);

        return cy.window().focus().then(function() {
          //# should not have changed actual activeElement
          expect(doc.activeElement).to.eq($input.get(0));

          $input.get(0).removeEventListener("blur", onBlur);
          win.removeEventListener("focus", onFocus);

          expect(focused).to.be.true;
          return expect(blurred).to.be.false;
        });
      });
    });

    it("can focus [contenteditable]", function() {
      const ce = cy.$$("[contenteditable]:first");

      return cy
        .get("[contenteditable]:first").focus()
        .focused().then($ce => expect($ce.get(0)).to.eq(ce.get(0)));
    });

    it("can focus svg elements", function() {
      const onFocus = cy.stub();

      cy.$$("[data-cy=rect]").focus(onFocus);

      return cy.get("[data-cy=rect]").focus().then(() => expect(onFocus).to.be.calledOnce);
    });

    it("can focus on readonly inputs", function() {
      const onFocus = cy.stub();

      cy.$$("#readonly-attr").focus(onFocus);

      return cy.get("#readonly-attr").focus().then(() => expect(onFocus).to.be.calledOnce);
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
        cy.$$(":text:first").focus(function() {
          return _.delay(() => {
            return $(this).addClass("focused");
          }
          , 100);
        });

        return cy.get(":text:first").focus().should("have.class", "focused").then(function() {
          const {
            lastLog
          } = this;

          expect(lastLog.get("name")).to.eq("assert");
          expect(lastLog.get("state")).to.eq("passed");
          return expect(lastLog.get("ended")).to.be.true;
        });
      });
    });

    describe(".log", function() {
      beforeEach(function() {
        this.logs = [];

        cy.on("log:added", (attrs, log) => {
          if (attrs.name === "focus") {
            this.lastLog = log;
            return this.logs.push(log);
          }
        });

        return null;
      });

      it("logs immediately before resolving", function() {
        const $input = cy.$$(":text:first");

        let expected = false;

        //# we can't end early here because our focus()
        //# command will still be in flight and the promise
        //# chain will get canceled before it gets attached
        //# (besides the code will continue to run and create
        //# side effects)
        cy.on("log:added", function(attrs, log) {
          if (log.get("name") === "focus") {
            expect(log.get("state")).to.eq("pending");
            expect(log.get("$el").get(0)).to.eq($input.get(0));
            return expected = true;
          }
        });

        return cy.get(":text:first").focus().then(() => expect(expected).to.be.true);
      });

      it("snapshots after clicking", () => cy.get(":text:first").focus().then(function() {
        const {
          lastLog
        } = this;

        expect(lastLog.get("snapshots").length).to.eq(1);
        return expect(lastLog.get("snapshots")[0]).to.be.an("object");
      }));

      it("passes in $el", () => cy.get("input:first").focus().then(function($input) {
        const {
          lastLog
        } = this;

        return expect(lastLog.get("$el")).to.eq($input);
      }));

      it("logs 2 focus event", () => cy
        .get("input:first").focus()
        .get("button:first").focus().then(function() {
          return expect(this.logs.length).to.eq(2);
      }));

      return it("#consoleProps", () => cy.get("input:first").focus().then(function($input) {
        return expect(this.lastLog.invoke("consoleProps")).to.deep.eq({
          Command: "focus",
          "Applied To": $input.get(0)
        });}));
  });

    return describe("errors", function() {
      beforeEach(function() {
        Cypress.config("defaultCommandTimeout", 100);

        this.logs = [];

        cy.on("log:added", (attrs, log) => {
          this.lastLog = log;
          return this.logs.push(log);
        });

        return null;
      });

      it("throws when not a dom subject", function(done) {
        cy.on("fail", () => done());

        return cy.noop({}).focus();
      });

      it("throws when subject is not in the document", function(done) {
        let focused = 0;

        var $input = cy.$$("input:first").focus(function(e) {
          focused += 1;
          $input.remove();
          return false;
        });

        cy.on("fail", function(err) {
          expect(focused).to.eq(1);
          expect(err.message).to.include("`cy.focus()` failed because this element");
          return done();
        });

        return cy.get("input:first").focus().focus();
      });

      it("throws when not a[href],link[href],button,input,select,textarea,[tabindex]", function(done) {
        cy.on("fail", function(err) {
          expect(err.message).to.include("`cy.focus()` can only be called on a valid focusable element. Your subject is a: `<form id=\"by-id\">...</form>`");
          expect(err.docsUrl).to.eq("https://on.cypress.io/focus");
          return done();
        });

        return cy.get("form").focus();
      });

      it("throws when subject is a collection of elements", function(done) {
        cy
          .get("textarea,:text").then(function($inputs) {
            this.num = $inputs.length;
            return $inputs;}).focus();

        return cy.on("fail", err => {
          expect(err.message).to.include(`\`cy.focus()\` can only be called on a single element. Your subject contained ${this.num} elements.`);
          expect(err.docsUrl).to.eq("https://on.cypress.io/focus");
          return done();
        });
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

        return cy.focus();
      });

      //# TODO: dont skip this
      it.skip("slurps up failed promises", function(done) {
        cy.timeout(1000);

        //# we only want to test when the document
        //# isnt in focus
        if (cy.state("document").hasFocus()) {
          return done();
        }

        // now = cy.now
        //
        // nowFn = (cmd) ->
        //   ## we stub cy.now so that when we're about to blur
        //   ## we cause isInDom to return false when its given
        //   ## the last input element
        //   if cmd is "blur"
        //     cy.stub(cy, "isInDom").returns(false)
        //
        //   now.apply(@, arguments)
        //
        // cy.stub(cy, "now", nowFn)

        const $first = cy.$$("input:first");
        const $last = cy.$$("input:last");

        $first.on("focus", function() {
          return $(this).remove();
        });

        cy.on("fail", function(err) {
          expect(err.message).to.include("`cy.blur()` failed because this element");
          return done();
        });

        //# we remove the first element and then
        //# focus on the 2nd.  the 2nd focus causes
        //# a blur on the 1st element, which should
        //# cause an error because its no longer in the DOM
        return cy
          .get("input:first").focus()
          .get("input:last").focus()
          .then(() => //# sometimes hasFocus() returns false
        //# even though its really in focus
        //# in those cases, just pass
        //# i cant come up with another way
        //# to test this accurately
        done());
      });

      it("eventually fails the assertion", function(done) {
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

        return cy.get(":text:first").focus().should("have.class", "focused");
      });

      return it("does not log an additional log on failure", function(done) {
        cy.on("fail", () => {
          expect(this.logs.length).to.eq(3);
          return done();
        });

        return cy.get(":text:first").focus().should("have.class", "focused");
      });
    });
  });

  return context("#blur", function() {
    it("should blur the originally focused element", function() {
      let blurred = false;

      cy.$$("#focus input").blur(() => blurred = true);

      return cy.get("#focus").within(() => cy
      .get("input").focus()
      .then($input => expect(getActiveElement()).to.eq($input.get(0))).get("button").focus()
      .then(function($btn) {
        expect(blurred).to.be.true;
        return expect(getActiveElement()).to.eq($btn.get(0));
      }));
    });

    it("sends a focusout event", function() {
      let focusout = false;

      cy.$$("#focus").focusout(() => focusout = true);

      return cy.get("#focus input").focus().blur().then(() => expect(focusout).to.be.true);
    });

    it("sends a blur event", function() {
      // cy.$$("input:text:first").get(0).addEventListener "blur", -> done()
      let blurred = false;

      cy.$$("input:first").blur(() => blurred = true);

      return cy.get("input:first").focus().blur().then(() => expect(blurred).to.be.true);
    });

    it("returns the original subject", function() {
      const input = cy.$$("input:first");

      return cy.get("input:first").focus().blur().then($input => expect($input).to.match(input));
    });

    it("can blur the body but does not change activeElement or fire blur events", function() {
      let doc;
      const { body } = (doc = cy.state("document"));

      let blurred = false;

      const onBlur = () => blurred = true;

      body.addEventListener("blur", onBlur);

      return cy
      .get("body").blur().then(() => expect(blurred).to.be.false).get("input:first").focus().then($input => cy
      .get("body").blur({ force: true })
      .then(function() {
        expect(doc.activeElement).to.eq($input.get(0));
        body.removeEventListener("blur", onBlur);

        return expect(blurred).to.be.false;
      }));
    });

    it("can blur the window but does not change activeElement", function() {
      const win = cy.state("window");
      const doc = cy.state("document");

      let blurred = false;

      const onBlur = () => blurred = true;

      win.addEventListener("blur", onBlur);

      return cy
      .window().blur().then(() => expect(blurred).to.be.true).get("input:first").focus().then($input => cy
      .window().blur({ force: true })
      .then(function() {
        expect(doc.activeElement).to.eq($input.get(0));
        return win.removeEventListener("blur", onBlur);
      }));
    });

    it("can blur [contenteditable]", function() {
      const ce = cy.$$("[contenteditable]:first");

      return cy
        .get("[contenteditable]:first").focus().blur().then($ce => expect($ce.get(0)).to.eq(ce.get(0)));
    });

    it("can blur input[type=time]", function() {
      let blurred = false;

      cy.$$("#time-without-value").blur(() => blurred = true);

      return cy
        .get("#time-without-value").focus().invoke("val", "03:15:00").blur()
        .then(() => expect(blurred).to.be.true);
    });

    it("can blur tabindex", function() {
      let blurred = false;

      cy
      .$$("#comments").blur(() => blurred = true).get(0).focus();

      return cy.get("#comments").blur().then(() => expect(blurred).to.be.true);
    });

    it("can force blurring on a non-focused element", function() {
      let blurred = false;

      cy.$$("input:first").blur(() => blurred = true);

      return cy
        .get("input:last").focus()
        .get("input:first").blur({force: true})
        .then(() => expect(blurred).to.be.true);
    });

    it("can force blurring when there is no focused element", function() {
      let blurred = false;

      cy.$$("input:first").blur(() => blurred = true);

      return cy
        .focused().should("not.exist")
        .get("input:first").blur({force: true})
        .then(() => expect(blurred).to.be.true);
    });

    it("can focus svg elements", function() {
      const onBlur = cy.stub();

      cy.$$("[data-cy=rect]").blur(onBlur);

      return cy.get("[data-cy=rect]").focus().blur().then(() => expect(onBlur).to.be.calledOnce);
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
        cy.$$(":text:first").blur(function() {
          return _.delay(() => {
            return $(this).addClass("blured");
          }
          , 100);
        });

        return cy.get(":text:first").focus().blur().should("have.class", "blured").then(function() {
          const {
            lastLog
          } = this;

          expect(lastLog.get("name")).to.eq("assert");
          expect(lastLog.get("state")).to.eq("passed");
          return expect(lastLog.get("ended")).to.be.true;
        });
      });
    });

    describe(".log", function() {
      beforeEach(function() {
        this.logs = [];

        cy.on("log:added", (attrs, log) => {
          if (attrs.name === "blur") {
            this.lastLog = log;
            return this.logs.push(log);
          }
        });

        return null;
      });

      it("logs immediately before resolving", function() {
        const input = cy.$$(":text:first");

        let expected = false;

        cy.on("log:added", function(attrs, log) {
          if (log.get("name") === "blur") {
            expect(log.get("state")).to.eq("pending");
            expect(log.get("$el").get(0)).to.eq(input.get(0));
            return expected = true;
          }
        });

        return cy.get(":text:first").focus().blur().then(() => expect(expected).to.be.true);
      });

      it("snapshots after clicking", () => cy.get(":text:first").focus().blur().then(function() {
        const {
          lastLog
        } = this;

        expect(lastLog.get("snapshots").length).to.eq(1);
        return expect(lastLog.get("snapshots")[0]).to.be.an("object");
      }));

      it("passes in $el", () => cy.get("input:first").focus().blur().then(function($input) {
        const {
          lastLog
        } = this;

        return expect(lastLog.get("$el")).to.eq($input);
      }));

      it("logs 1 blur event", () => cy
        .get("input:first").focus().blur().then(function() {
          return expect(this.logs.length).to.eq(1);
      }));

      it("logs delta options for {force: true}", () => cy
        .get("input:first").blur({force: true}).then(function() {
          const {
            lastLog
          } = this;

          return expect(lastLog.get("message")).to.eq("{force: true}");
      }));

      return it("#consoleProps", () => cy.get("input:first").focus().blur().then(function($input) {
        return expect(this.lastLog.invoke("consoleProps")).to.deep.eq({
          Command: "blur",
          "Applied To": $input.get(0)
        });}));
  });

    return describe("errors", function() {
      beforeEach(function() {
        Cypress.config("defaultCommandTimeout", 100);

        this.logs = [];

        cy.on("log:added", (attrs, log) => {
          this.lastLog = log;
          return this.logs.push(log);
        });

        return null;
      });

      it("throws when not a dom subject", function(done) {
        cy.on("fail", function(err) {
          expect(err.message).to.include("`cy.blur()` failed because it requires a DOM element");
          return done();
        });

        return cy.noop({}).blur();
      });

      it("throws when subject is not in the document", function(done) {
        let blurred = 0;

        var $input = cy.$$("input:first").blur(function(e) {
          blurred += 1;
          $input.focus(function() {
            $input.remove();
            return false;
          });
          return false;
        });

        cy.on("fail", function(err) {
          expect(blurred).to.eq(1);
          expect(err.message).to.include("`cy.blur()` failed because this element");
          expect(err.docsUrl).to.include("https://on.cypress.io/element-has-detached-from-dom");
          return done();
        });

        return cy.get("input:first").focus().blur().focus().blur();
      });

      it("throws when subject is a collection of elements", function(done) {
        const num = cy.$$("textarea,:text").length;

        cy.on("fail", err => {
          expect(err.message).to.include(`\`cy.blur()\` can only be called on a single element. Your subject contained ${num} elements.`);
          expect(err.docsUrl).to.include("https://on.cypress.io/blur");
          return done();
        });

        return cy.get("textarea,:text").blur();
      });

      it("throws when there isnt an activeElement", function(done) {
        cy.on("fail", function(err) {
          expect(err.message).to.include("`cy.blur()` can only be called when there is a currently focused element.");
          expect(err.docsUrl).to.include("https://on.cypress.io/blur");
          return done();
        });

        return cy.get("form:first").blur();
      });

      it("throws when blur is called on a non-active element", function(done) {
        cy.on("fail", function(err) {
          expect(err.message).to.include("`cy.blur()` can only be called on the focused element. Currently the focused element is a: `<input id=\"input\">`");
          expect(err.docsUrl).to.include("https://on.cypress.io/blur");
          return done();
        });

        cy.get("input:first").focus();
        return cy.get("#button").blur();
      });

      it("logs delta options on error", function(done) {
        cy.$$("button:first").click(function() {
          return $(this).remove();
        });

        cy.on("fail", err => {
          const {
            lastLog
          } = this;

          expect(lastLog.get("message")).to.eq("{force: true}");
          return done();
        });

        return cy.get("button:first").click().blur({force: true});
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

        return cy.blur();
      });

      it("eventually fails the assertion", function(done) {
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

        return cy.get(":text:first").focus().blur().should("have.class", "blured");
      });

      it("does not log an additional log on failure", function(done) {
        cy.on("fail", () => {
          expect(this.logs.length).to.eq(4);
          return done();
        });

        return cy.get(":text:first").focus().blur().should("have.class", "blured");
      });

      return it("can handle window w/length > 1 as a subject", () => cy.window().should('have.length', 2)
      .focus());
    });
  });
});
