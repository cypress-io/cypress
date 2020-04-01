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

describe("src/cy/commands/actions/check", function() {
  before(() => cy
    .visit("/fixtures/dom.html")
    .then(function(win) {
      return this.body = win.document.body.outerHTML;
  }));

  beforeEach(function() {
    const doc = cy.state("document");

    return $(doc.body).empty().html(this.body);
  });

  context("#check", function() {
    it("does not change the subject", function() {
      const inputs = $("[name=colors]");

      return cy.get("[name=colors]").check().then(function($inputs) {
        expect($inputs.length).to.eq(3);
        return expect($inputs.toArray()).to.deep.eq(inputs.toArray());
      });
    });

    it("changes the subject if specific value passed to check", function() {
      const checkboxes = $("[name=colors]");

      return cy.get("[name=colors]").check(["blue", "red"]).then(function($chk) {
        expect($chk.length).to.eq(2);

        const blue = checkboxes.filter("[value=blue]");
        const red  = checkboxes.filter("[value=red]");

        expect($chk.get(0)).to.eq(blue.get(0));
        return expect($chk.get(1)).to.eq(red.get(0));
      });
    });

    it("filters out values which were not found", function() {
      const checkboxes = $("[name=colors]");

      return cy.get("[name=colors]").check(["blue", "purple"]).then(function($chk) {
        expect($chk.length).to.eq(1);

        const blue = checkboxes.filter("[value=blue]");

        return expect($chk.get(0)).to.eq(blue.get(0));
      });
    });

    it("changes the subject when matching values even if noop", function() {
      const checked = $("<input type='checkbox' name='colors' value='blue' checked>");
      $("[name=colors]").parent().append(checked);

      const checkboxes = $("[name=colors]");

      return cy.get("[name=colors]").check("blue").then(function($chk) {
        expect($chk.length).to.eq(2);

        const blue = checkboxes.filter("[value=blue]");

        expect($chk.get(0)).to.eq(blue.get(0));
        return expect($chk.get(1)).to.eq(blue.get(1));
      });
    });

    it("checks a checkbox", () => cy.get(":checkbox[name='colors'][value='blue']").check().then($checkbox => expect($checkbox).to.be.checked));

    it("checks a radio", () => cy.get(":radio[name='gender'][value='male']").check().then($radio => expect($radio).to.be.checked));

    it("is a noop if already checked", function() {
      const checkbox = ":checkbox[name='colors'][value='blue']";

      $(checkbox).prop("checked", true);

      $(checkbox).change(() => done("should not fire change event"));

      return cy.get(checkbox).check();
    });

    //# readonly should only be limited to inputs, not checkboxes
    it("can check readonly checkboxes", () => cy.get('#readonly-checkbox').check().then($checkbox => expect($checkbox).to.be.checked));

    it("does not require visibility with force: true", function() {
      const checkbox = ":checkbox[name='birds']";
      $(checkbox).last().hide();

      return cy.get(checkbox).check({force: true}).then($checkbox => expect($checkbox).to.be.checked);
    });

    it("can check a collection", () => cy.get("[name=colors]").check().then($inputs => $inputs.each((i, el) => expect($(el)).to.be.checked)));

    it("can check a specific value from a collection", () => cy.get("[name=colors]").check("blue").then(function($inputs) {
      expect($inputs.filter(":checked").length).to.eq(1);
      return expect($inputs.filter("[value=blue]")).to.be.checked;
    }));

    it("can check multiple values from a collection", () => cy.get("[name=colors]").check(["blue", "green"]).then(function($inputs) {
      expect($inputs.filter(":checked").length).to.eq(2);
      return expect($inputs.filter("[value=blue],[value=green]")).to.be.checked;
    }));

    it("can forcibly click even when being covered by another element", function() {
      const checkbox = $("<input type='checkbox' />").attr("id", "checkbox-covered-in-span").prependTo($("body"));
      const span = $("<span>span on checkbox</span>").css({position: "absolute", left: checkbox.offset().left, top: checkbox.offset().top, padding: 5, display: "inline-block", backgroundColor: "yellow"}).prependTo($("body"));

      let clicked = false;

      checkbox.on("click", () => clicked = true);

      return cy.get("#checkbox-covered-in-span").check({force: true}).then(() => expect(clicked).to.be.true);
    });

    it("passes timeout and interval down to click", function(done) {
      const checkbox  = $("<input type='checkbox' />")
      .attr("id", "checkbox-covered-in-span")
      .prependTo($("body"));

      const span = $("<span>span on checkbox</span>")
      .css({
        position: "absolute",
        left: checkbox.offset().left,
        top: checkbox.offset().top,
        padding: 5,
        display: "inline-block",
        backgroundColor: "yellow"
      })
      .prependTo($("body"));

      cy.on("command:retry", _.once(function(options) {
        expect(options.timeout).to.eq(1000);
        expect(options.interval).to.eq(60);
        return done();
      })
      );

      return cy.get("#checkbox-covered-in-span").check({timeout: 1000, interval: 60});
    });

    it("waits until element is no longer disabled", function() {
      const chk = $(":checkbox:first").prop("disabled", true);

      let retried = false;
      let clicks = 0;

      chk.on("click", () => clicks += 1);

      cy.on("command:retry", _.after(3, function() {
        chk.prop("disabled", false);
        return retried = true;
      })
      );

      return cy.get(":checkbox:first").check().then(function() {
        expect(clicks).to.eq(1);
        return expect(retried).to.be.true;
      });
    });

    it("delays 50ms before resolving", function() {
      cy.$$(":checkbox:first").on("change", e => {
        return cy.spy(Promise, "delay");
      });

      return cy.get(":checkbox:first").check().then(() => expect(Promise.delay).to.be.calledWith(50, "click"));
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

      it("eventually passes the assertion", function() {
        $(":checkbox:first").click(function() {
          return _.delay(() => {
            return $(this).addClass("checked");
          }
          , 100);
        });

        return cy.get(":checkbox:first").check().should("have.class", "checked").then(function() {
          const {
            lastLog
          } = this;

          expect(lastLog.get("name")).to.eq("assert");
          expect(lastLog.get("state")).to.eq("passed");
          return expect(lastLog.get("ended")).to.be.true;
        });
      });

      return it("eventually passes the assertion on multiple :checkboxs", function() {
        $(":checkbox").click(function() {
          return _.delay(() => {
            return $(this).addClass("checked");
          }
          , 100);
        });

        return cy.get(":checkbox").invoke("slice", 0, 2).check().should("have.class", "checked");
      });
    });

    describe("events", function() {
      it("emits click event", function(done) {
        $("[name=colors][value=blue]").click(() => done());
        return cy.get("[name=colors]").check("blue");
      });

      it("emits change event", function(done) {
        $("[name=colors][value=blue]").change(() => done());
        return cy.get("[name=colors]").check("blue");
      });

      return it("emits focus event", function() {
        let focus = false;
        $("[name=colors][value=blue]").focus(() => focus = true);
        return cy.get("[name=colors]")
        .check("blue")
        .then(() => expect(focus).to.eq(true));
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

      it("throws when subject isnt dom", function(done) {
        cy.on("fail", err => done());

        return cy.noop({}).check();
      });

      it("throws when subject is not in the document", function(done) {
        let checked = 0;

        var checkbox = $(":checkbox:first").click(function(e) {
          checked += 1;
          checkbox.remove();
          return false;
        });

        cy.on("fail", function(err) {
          expect(checked).to.eq(1);
          expect(err.message).to.include("`cy.check()` failed because this element");
          return done();
        });

        return cy.get(":checkbox:first").check().check();
      });

      it("throws when subject isnt a checkbox or radio", function(done) {
        cy.on("fail", function(err) {
          expect(err.message).to.include("`cy.check()` can only be called on `:checkbox` and `:radio`. Your subject contains a: `<form id=\"by-id\">...</form>`");
          expect(err.docsUrl).to.include("https://on.cypress.io/check");
          return done();
        });

        //# this will find multiple forms
        return cy.get("form").check();
      });

      it("throws when any member of the subject isnt a checkbox or radio", function(done) {
        cy.on("fail", function(err) {
          expect(err.message).to.include("`cy.check()` can only be called on `:checkbox` and `:radio`. Your subject contains a: `<textarea id=\"comments\"></textarea>`");
          expect(err.docsUrl).to.include("https://on.cypress.io/check");
          return done();
        });

        //# find a textare which should blow up
        //# the textarea is the last member of the subject
        return cy.get(":checkbox,:radio,#comments").check();
      });

      it("throws when any member of the subject isnt visible", function(done) {
        const chk = $(":checkbox").first().hide();

        cy.on("fail", err => {
          const {
            lastLog
          } = this;

          expect(this.logs.length).to.eq(chk.length + 1);
          expect(lastLog.get("error")).to.eq(err);
          expect(err.message).to.include("`cy.check()` failed because this element is not visible");
          return done();
        });

        return cy.get(":checkbox:first").check();
      });

      it("throws when subject is disabled", function(done) {
        $(":checkbox:first").prop("disabled", true);

        cy.on("fail", err => {
          //# get + type logs
          expect(this.logs.length).eq(2);
          expect(err.message).to.include("`cy.check()` failed because this element is `disabled`:\n");
          return done();
        });

        return cy.get(":checkbox:first").check();
      });

      it("still ensures visibility even during a noop", function(done) {
        const chk = $(":checkbox");
        chk.show().last().hide();

        cy.on("fail", err => {
          const {
            lastLog
          } = this;

          expect(this.logs.length).to.eq(chk.length + 1);
          expect(lastLog.get("error")).to.eq(err);
          expect(err.message).to.include("`cy.check()` failed because this element is not visible");
          return done();
        });

        return cy.get(":checkbox").check();
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

        return cy.check();
      });

      it("throws when input cannot be clicked", function(done) {
        const checkbox  = $("<input type='checkbox' />").attr("id", "checkbox-covered-in-span").prependTo($("body"));
        const span = $("<span>span on button</span>").css({position: "absolute", left: checkbox.offset().left, top: checkbox.offset().top, padding: 5, display: "inline-block", backgroundColor: "yellow"}).prependTo($("body"));

        cy.on("fail", err => {
          expect(this.logs.length).to.eq(2);
          expect(err.message).to.include("`cy.check()` failed because this element");
          expect(err.message).to.include("is being covered by another element");
          return done();
        });

        return cy.get("#checkbox-covered-in-span").check();
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

        return cy.get(":checkbox:first").check().should("have.class", "checked");
      });

      return it("does not log an additional log on failure", function(done) {
        cy.on("fail", () => {
          expect(this.logs.length).to.eq(3);
          return done();
        });

        return cy.get(":checkbox:first").check().should("have.class", "checked");
      });
    });

    return describe(".log", function() {
      beforeEach(function() {
        cy.on("log:added", (attrs, log) => {
          return this.lastLog = log;
        });

        return null;
      });

      it("logs immediately before resolving", function(done) {
        const chk = $(":checkbox:first");

        cy.on("log:added", function(attrs, log) {
          if (log.get("name") === "check") {
            expect(log.get("state")).to.eq("pending");
            expect(log.get("$el").get(0)).to.eq(chk.get(0));
            return done();
          }
        });

        return cy.get(":checkbox:first").check();
      });

      it("snapshots before clicking", function(done) {
        $(":checkbox:first").change(() => {
          const {
            lastLog
          } = this;

          expect(lastLog.get("snapshots").length).to.eq(1);
          expect(lastLog.get("snapshots")[0].name).to.eq("before");
          expect(lastLog.get("snapshots")[0].body).to.be.an("object");
          return done();
        });

        return cy.get(":checkbox:first").check();
      });

      it("snapshots after clicking", () => cy.get(":checkbox:first").check().then(function() {
        const {
          lastLog
        } = this;

        expect(lastLog.get("snapshots").length).to.eq(2);
        expect(lastLog.get("snapshots")[1].name).to.eq("after");
        return expect(lastLog.get("snapshots")[1].body).to.be.an("object");
      }));

      it("logs only 1 check event on click of 1 checkbox", function() {
        const logs = [];
        const checks = [];

        cy.on("log:added", function(attrs, log) {
          logs.push(log);
          if (log.get("name") === "check") { return checks.push(log); }
        });

        return cy.get("[name=colors][value=blue]").check().then(function() {
          expect(logs.length).to.eq(2);
          return expect(checks).to.have.length(1);
        });
      });

      it("logs only 1 check event on click of 1 radio", function() {
        const logs = [];
        const radios = [];

        cy.on("log:added", function(attrs, log) {
          logs.push(log);
          if (log.get("name") === "check") { return radios.push(log); }
        });

        return cy.get("[name=gender][value=female]").check().then(function() {
          expect(logs.length).to.eq(2);
          return expect(radios).to.have.length(1);
        });
      });

      it("logs only 1 check event on checkbox with 1 matching value arg", function() {
        const logs = [];
        const checks = [];

        cy.on("log:added", function(attrs, log) {
          logs.push(log);
          if (log.get("name") === "check") { return checks.push(log); }
        });

        return cy.get("[name=colors]").check("blue").then(function() {
          expect(logs.length).to.eq(2);
          return expect(checks).to.have.length(1);
        });
      });

      it("logs only 1 check event on radio with 1 matching value arg", function() {
        const logs = [];
        const radios = [];

        cy.on("log:added", function(attrs, log) {
          logs.push(log);
          if (log.get("name") === "check") { return radios.push(log); }
        });

        return cy.get("[name=gender]").check("female").then(function() {
          expect(logs.length).to.eq(2);
          return expect(radios).to.have.length(1);
        });
      });

      it("passes in $el", () => cy.get("[name=colors][value=blue]").check().then(function($input) {
        const {
          lastLog
        } = this;

        return expect(lastLog.get("$el").get(0)).to.eq($input.get(0));
      }));

      it("passes in coords", () => cy.get("[name=colors][value=blue]").check().then(function($input) {
        const {
          lastLog
        } = this;
        const { fromElWindow }= Cypress.dom.getElementCoordinatesByPosition($input);
        return expect(lastLog.get("coords")).to.deep.eq(fromElWindow);
      }));

      it("ends command when checkbox is already checked", () => cy.get("[name=colors][value=blue]").check().check().then(function() {
        const {
          lastLog
        } = this;

        return expect(lastLog.get("state")).eq("passed");
      }));

      it("#consoleProps", () => cy.get("[name=colors][value=blue]").check().then(function($input) {
        const {
          lastLog
        } = this;

        const { fromElWindow }= Cypress.dom.getElementCoordinatesByPosition($input);
        const console = lastLog.invoke("consoleProps");
        expect(console.Command).to.eq("check");
        expect(console["Applied To"]).to.eq(lastLog.get("$el").get(0));
        expect(console.Elements).to.eq(1);
        return expect(console.Coords).to.deep.eq(
          _.pick(fromElWindow, "x", "y")
        );
      }));

      it("#consoleProps when checkbox is already checked", () => cy.get("[name=colors][value=blue]").invoke("prop", "checked", true).check().then(function($input) {
        const {
          lastLog
        } = this;

        expect(lastLog.get("coords")).to.be.undefined;
        return expect(lastLog.invoke("consoleProps")).to.deep.eq({
          Command: "check",
          "Applied To": lastLog.get("$el").get(0),
          Elements: 1,
          Note: "This checkbox was already checked. No operation took place.",
          Options: undefined
        });}));

      it("#consoleProps when radio is already checked", () => cy.get("[name=gender][value=male]").check().check().then(function($input) {
        const {
          lastLog
        } = this;

        expect(lastLog.get("coords")).to.be.undefined;
        return expect(lastLog.invoke("consoleProps")).to.deep.eq({
          Command: "check",
          "Applied To": lastLog.get("$el").get(0),
          Elements: 1,
          Note: "This radio was already checked. No operation took place.",
          Options: undefined
        });}));

      it("#consoleProps when checkbox with value is already checked", function() {
        $("[name=colors][value=blue]").prop("checked", true);

        return cy.get("[name=colors]").check("blue").then(function($input) {
          const {
            lastLog
          } = this;

          expect(lastLog.get("coords")).to.be.undefined;
          return expect(lastLog.invoke("consoleProps")).to.deep.eq({
            Command: "check",
            "Applied To": lastLog.get("$el").get(0),
            Elements: 1,
            Note: "This checkbox was already checked. No operation took place.",
            Options: undefined
          });});
    });

      return it("logs deltaOptions", () => cy.get("[name=colors][value=blue]").check({force: true, timeout: 1000}).then(function() {
        const {
          lastLog
        } = this;

        expect(lastLog.get("message")).to.eq("{force: true, timeout: 1000}");
        return expect(lastLog.invoke("consoleProps").Options).to.deep.eq({force: true, timeout: 1000});}));
  });
});

  return context("#uncheck", function() {
    it("does not change the subject", function() {
      const inputs = $("[name=birds]");

      return cy.get("[name=birds]").uncheck().then(function($inputs) {
        expect($inputs.length).to.eq(2);
        return expect($inputs.toArray()).to.deep.eq(inputs.toArray());
      });
    });

    it("changes the subject if specific value passed to check", function() {
      const checkboxes = $("[name=birds]");

      return cy.get("[name=birds]").check(["cockatoo", "amazon"]).then(function($chk) {
        expect($chk.length).to.eq(2);

        const cockatoo = checkboxes.filter("[value=cockatoo]");
        const amazon   = checkboxes.filter("[value=amazon]");

        expect($chk.get(0)).to.eq(cockatoo.get(0));
        return expect($chk.get(1)).to.eq(amazon.get(0));
      });
    });

    it("filters out values which were not found", function() {
      const checkboxes = $("[name=birds]");

      return cy.get("[name=birds]").check(["cockatoo", "parrot"]).then(function($chk) {
        expect($chk.length).to.eq(1);

        const cockatoo = checkboxes.filter("[value=cockatoo]");

        return expect($chk.get(0)).to.eq(cockatoo.get(0));
      });
    });

    it("changes the subject when matching values even if noop", function() {
      const checked = $("<input type='checkbox' name='birds' value='cockatoo'>");
      $("[name=birds]").parent().append(checked);

      const checkboxes = $("[name=birds]");

      return cy.get("[name=birds]").check("cockatoo").then(function($chk) {
        expect($chk.length).to.eq(2);

        const cockatoo = checkboxes.filter("[value=cockatoo]");

        expect($chk.get(0)).to.eq(cockatoo.get(0));
        return expect($chk.get(1)).to.eq(cockatoo.get(1));
      });
    });

    it("unchecks a checkbox", () => cy.get("[name=birds][value=cockatoo]").uncheck().then($checkbox => expect($checkbox).not.to.be.checked));

    it("unchecks a checkbox by value", () => cy.get("[name=birds]").uncheck("cockatoo").then(function($checkbox) {
      expect($checkbox.filter(":checked").length).to.eq(0);
      return expect($checkbox.filter("[value=cockatoo]")).not.to.be.checked;
    }));

    it("unchecks multiple checkboxes by values", () => cy.get("[name=birds]").uncheck(["cockatoo", "amazon"]).then(function($checkboxes) {
      expect($checkboxes.filter(":checked").length).to.eq(0);
      return expect($checkboxes.filter("[value=cockatoo],[value=amazon]")).not.to.be.checked;
    }));

    it("is a noop if already unchecked", function() {
      let checked = false;
      const checkbox = "[name=birds][value=cockatoo]";

      $(checkbox).prop("checked", false).change(() => checked = true);

      return cy.get(checkbox).uncheck().then(() => expect(checked).to.be.false);
    });

    it("can forcibly click even when being covered by another element", function(done) {
      const checkbox  = $("<input type='checkbox' />").attr("id", "checkbox-covered-in-span").prop("checked", true).prependTo($("body"));
      const span = $("<span>span on checkbox</span>").css({position: "absolute", left: checkbox.offset().left, top: checkbox.offset().top, padding: 5, display: "inline-block", backgroundColor: "yellow"}).prependTo($("body"));

      checkbox.on("click", () => done());

      return cy.get("#checkbox-covered-in-span").uncheck({force: true});
    });

    it("passes timeout and interval down to click", function(done) {
      const checkbox  = $("<input type='checkbox' />").attr("id", "checkbox-covered-in-span").prop("checked", true).prependTo($("body"));
      const span = $("<span>span on checkbox</span>").css({position: "absolute", left: checkbox.offset().left, top: checkbox.offset().top, padding: 5, display: "inline-block", backgroundColor: "yellow"}).prependTo($("body"));

      cy.on("command:retry", function(options) {
        expect(options.timeout).to.eq(1000);
        expect(options.interval).to.eq(60);
        return done();
      });

      return cy.get("#checkbox-covered-in-span").uncheck({timeout: 1000, interval: 60});
    });

    it("waits until element is no longer disabled", function() {
      const chk = $(":checkbox:first").prop("checked", true).prop("disabled", true);

      let retried = false;
      let clicks = 0;

      chk.on("click", () => clicks += 1);

      cy.on("command:retry", _.after(3, function() {
        chk.prop("disabled", false);
        return retried = true;
      })
      );

      return cy.get(":checkbox:first").uncheck().then(function() {
        expect(clicks).to.eq(1);
        return expect(retried).to.be.true;
      });
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
        $(":checkbox:first").prop("checked", true).click(function() {
          return _.delay(() => {
            return $(this).addClass("unchecked");
          }
          , 100);
        });

        return cy.get(":checkbox:first").uncheck().should("have.class", "unchecked").then(function() {
          const {
            lastLog
          } = this;

          expect(lastLog.get("name")).to.eq("assert");
          expect(lastLog.get("state")).to.eq("passed");
          return expect(lastLog.get("ended")).to.be.true;
        });
      });
    });

    describe("events", function() {
      it("emits click event", function(done) {
        $("[name=colors][value=blue]").prop("checked", true).click(() => done());
        return cy.get("[name=colors]").uncheck("blue");
      });

      return it("emits change event", function(done) {
        $("[name=colors][value=blue]").prop("checked", true).change(() => done());
        return cy.get("[name=colors]").uncheck("blue");
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

      it("throws specifically on a radio", function(done) {
        cy.get(":radio").uncheck();

        return cy.on("fail", function(err) {
          expect(err.message).to.include("`cy.uncheck()` can only be called on `:checkbox`.");
          expect(err.docsUrl).to.include("https://on.cypress.io/uncheck");
          return done();
        });
      });

      it("throws if not a checkbox", function(done) {
        cy.noop({}).uncheck();

        return cy.on("fail", () => done());
      });

      it("throws when any member of the subject isnt visible", function(done) {
        //# grab the first 3 checkboxes.
        const chk = $(":checkbox").slice(0, 3).show();

        cy.on("fail", err => {
          const {
            lastLog
          } = this;

          const len  = (chk.length * 2) + 6;
          expect(this.logs.length).to.eq(len);
          expect(lastLog.get("error")).to.eq(err);
          expect(err.message).to.include("`cy.uncheck()` failed because this element is not visible");
          return done();
        });

        return cy
          .get(":checkbox").invoke("slice", 0, 3).check().last().invoke("hide")
          .get(":checkbox").invoke("slice", 0, 3).uncheck();
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

        return cy.uncheck();
      });

      it("throws when subject is not in the document", function(done) {
        let unchecked = 0;

        var checkbox = $(":checkbox:first").prop("checked", true).click(function(e) {
          unchecked += 1;
          checkbox.prop("checked", true);
          checkbox.remove();
          return false;
        });

        cy.on("fail", function(err) {
          expect(unchecked).to.eq(1);
          expect(err.message).to.include("`cy.uncheck()` failed because this element");
          return done();
        });

        return cy.get(":checkbox:first").uncheck().uncheck();
      });

      it("throws when input cannot be clicked", function(done) {
        const checkbox  = $("<input type='checkbox' />").attr("id", "checkbox-covered-in-span").prop("checked", true).prependTo($("body"));
        const span = $("<span>span on button</span>").css({position: "absolute", left: checkbox.offset().left, top: checkbox.offset().top, padding: 5, display: "inline-block", backgroundColor: "yellow"}).prependTo($("body"));

        cy.on("fail", err => {
          expect(this.logs.length).to.eq(2);
          expect(err.message).to.include("`cy.uncheck()` failed because this element");
          expect(err.message).to.include("is being covered by another element");
          return done();
        });

        return cy.get("#checkbox-covered-in-span").uncheck();
      });

      it("throws when subject is disabled", function(done) {
        $(":checkbox:first").prop("checked", true).prop("disabled", true);

        cy.on("fail", err => {
          //# get + type logs
          expect(this.logs.length).eq(2);
          expect(err.message).to.include("`cy.uncheck()` failed because this element is `disabled`:\n");
          return done();
        });

        return cy.get(":checkbox:first").uncheck();
      });

      it("eventually passes the assertion on multiple :checkboxs", function() {
        $(":checkbox").prop("checked", true).click(function() {
          return _.delay(() => {
            return $(this).addClass("unchecked");
          }
          , 100);
        });

        return cy.get(":checkbox").invoke("slice", 0, 2).uncheck().should("have.class", "unchecked");
      });

      it("eventually fails the assertion", function(done) {
        $(":checkbox:first").prop("checked", true);

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

        return cy.get(":checkbox:first").uncheck().should("have.class", "unchecked");
      });

      return it("does not log an additional log on failure", function(done) {
        cy.on("fail", () => {
          expect(this.logs.length).to.eq(3);
          return done();
        });

        return cy.get(":checkbox:first").uncheck().should("have.class", "unchecked");
      });
    });

    return describe(".log", function() {
      beforeEach(function() {
        $("[name=colors][value=blue]").prop("checked", true);

        cy.on("log:added", (attrs, log) => {
          return this.lastLog = log;
        });

        return null;
      });

      it("logs immediately before resolving", function(done) {
        const chk = $(":checkbox:first");

        cy.on("log:added", function(attrs, log) {
          if (log.get("name") === "uncheck") {
            expect(log.get("state")).to.eq("pending");
            expect(log.get("$el").get(0)).to.eq(chk.get(0));
            return done();
          }
        });

        return cy.get(":checkbox:first").check().uncheck();
      });

      it("snapshots before unchecking", function(done) {
        $(":checkbox:first").change(() => {
          const {
            lastLog
          } = this;

          expect(lastLog.get("snapshots").length).to.eq(1);
          expect(lastLog.get("snapshots")[0].name).to.eq("before");
          expect(lastLog.get("snapshots")[0].body).to.be.an("object");
          return done();
        });

        return cy.get(":checkbox:first").invoke("prop", "checked", true).uncheck();
      });

      it("snapshots after unchecking", () => cy.get(":checkbox:first").invoke("prop", "checked", true).uncheck().then(function() {
        const {
          lastLog
        } = this;

        expect(lastLog.get("snapshots").length).to.eq(2);
        expect(lastLog.get("snapshots")[1].name).to.eq("after");
        return expect(lastLog.get("snapshots")[1].body).to.be.an("object");
      }));

      it("logs only 1 uncheck event", function() {
        const logs = [];
        const unchecks = [];

        cy.on("log:added", function(attrs, log) {
          logs.push(log);
          if (log.get("name") === "uncheck") { return unchecks.push(log); }
        });

        return cy.get("[name=colors][value=blue]").uncheck().then(function() {
          expect(logs.length).to.eq(2);
          return expect(unchecks).to.have.length(1);
        });
      });

      it("logs only 1 uncheck event on uncheck with 1 matching value arg", function() {
        const logs = [];
        const unchecks = [];

        cy.on("log:added", function(attrs, log) {
          logs.push(log);
          if (log.get("name") === "uncheck") { return unchecks.push(log); }
        });

        return cy.get("[name=colors]").uncheck("blue").then(function() {
          expect(logs.length).to.eq(2);
          return expect(unchecks).to.have.length(1);
        });
      });

      it("passes in $el", () => cy.get("[name=colors][value=blue]").uncheck().then(function($input) {
        const {
          lastLog
        } = this;

        return expect(lastLog.get("$el").get(0)).to.eq($input.get(0));
      }));

      it("ends command when checkbox is already unchecked", () => cy.get("[name=colors][value=blue]").invoke("prop", "checked", false).uncheck().then(function() {
        const {
          lastLog
        } = this;

        return expect(lastLog.get("state")).eq("passed");
      }));

      it("#consoleProps", () => cy.get("[name=colors][value=blue]").uncheck().then(function($input) {
        const {
          lastLog
        } = this;

        const { fromElWindow } = Cypress.dom.getElementCoordinatesByPosition($input);
        const console = lastLog.invoke("consoleProps");
        expect(console.Command).to.eq("uncheck");
        expect(console["Applied To"]).to.eq(lastLog.get("$el").get(0));
        expect(console.Elements).to.eq(1);
        return expect(console.Coords).to.deep.eq(
          _.pick(fromElWindow, "x", "y")
        );
      }));

      it("#consoleProps when checkbox is already unchecked", () => cy.get("[name=colors][value=blue]").invoke("prop", "checked", false).uncheck().then(function($input) {
        const {
          lastLog
        } = this;

        expect(lastLog.get("coords")).to.be.undefined;
        return expect(lastLog.invoke("consoleProps")).to.deep.eq({
          Command: "uncheck",
          "Applied To": lastLog.get("$el").get(0),
          Elements: 1,
          Note: "This checkbox was already unchecked. No operation took place.",
          Options: undefined
        });}));

      it("#consoleProps when checkbox with value is already unchecked", function() {
        cy.get("[name=colors][value=blue]").invoke("prop", "checked", false);
        return cy.get("[name=colors]").uncheck("blue").then(function($input) {
          const {
            lastLog
          } = this;

          expect(lastLog.get("coords")).to.be.undefined;
          return expect(lastLog.invoke("consoleProps")).to.deep.eq({
            Command: "uncheck",
            "Applied To": lastLog.get("$el").get(0),
            Elements: 1,
            Note: "This checkbox was already unchecked. No operation took place.",
            Options: undefined
          });});
    });

      return it("logs deltaOptions", () => cy.get("[name=colors][value=blue]").check().uncheck({force: true, timeout: 1000}).then(function() {
        const {
          lastLog
        } = this;

        expect(lastLog.get("message")).to.eq("{force: true, timeout: 1000}");
        return expect(lastLog.invoke("consoleProps").Options).to.deep.eq({force: true, timeout: 1000});}));
  });
});
});
