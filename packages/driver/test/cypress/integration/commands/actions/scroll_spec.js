/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {
  $
} = Cypress.$Cypress;
const {
  _
} = Cypress;

describe("src/cy/commands/actions/scroll", function() {
  before(() => cy
    .visit("/fixtures/scrolling.html")
    .then(function(win) {
      return this.body = win.document.body.outerHTML;
  }));

  beforeEach(function() {
    const doc = cy.state("document");

    $(doc.body).empty().html(this.body);

    return cy.viewport(600, 200);
  });

  context("#scrollTo", function() {
    beforeEach(function() {
      this.win          = cy.state("window");
      this.scrollVert   = cy.$$("#scroll-to-vertical");
      this.scrollHoriz  = cy.$$("#scroll-to-horizontal");
      this.scrollBoth   = cy.$$("#scroll-to-both");

      //# reset the scrollable containers back
      //# to furthest left and top
      this.win.scrollTop           = 0;
      this.win.scrollLeft          = 0;

      this.scrollVert.scrollTop    = 0;
      this.scrollVert.scrollLeft   = 0;

      this.scrollHoriz.scrollTop   = 0;
      this.scrollHoriz.scrollLeft  = 0;

      this.scrollBoth.scrollTop    = 0;
      return this.scrollBoth.scrollLeft   = 0;
    });

    describe("subject", function() {
      it("is window by default", () => cy.scrollTo("125px").then(function(win2) {
        return expect(this.win).to.eq(win2);
      }));

      it("is DOM", () => cy.get("#scroll-to-vertical").scrollTo("125px").then(function($el) {
        return expect($el.get(0)).to.eq(this.scrollVert.get(0));
      }));

      it("can use window", () => cy.window().scrollTo("10px").then(win => expect(win.scrollX).to.eq(10)));

      return it("can handle window w/length > 1 as a subject", function() {
        cy.visit('/fixtures/dom.html');
        return cy.window().should('have.length.gt', 1)
        .scrollTo('10px');
      });
    });

    describe("x axis only", function() {
      it("scrolls x axis to num px", function() {
        expect(this.scrollHoriz.get(0).scrollTop).to.eq(0);
        expect(this.scrollHoriz.get(0).scrollLeft).to.eq(0);

        return cy.get("#scroll-to-horizontal").scrollTo(300).then(function($el) {
          expect(this.scrollHoriz.get(0).scrollTop).to.eq(0);
          return expect(this.scrollHoriz.get(0).scrollLeft).to.eq(300);
        });
      });

      it("scrolls x axis to px", function() {
        expect(this.scrollHoriz.get(0).scrollTop).to.eq(0);
        expect(this.scrollHoriz.get(0).scrollLeft).to.eq(0);

        return cy.get("#scroll-to-horizontal").scrollTo("125px").then(function($el) {
          expect(this.scrollHoriz.get(0).scrollTop).to.eq(0);
          return expect(this.scrollHoriz.get(0).scrollLeft).to.eq(125);
        });
      });

      return it("scrolls x axis by % of scrollable height", function() {
        expect(this.scrollHoriz.get(0).scrollTop).to.eq(0);
        expect(this.scrollHoriz.get(0).scrollLeft).to.eq(0);

        return cy.get("#scroll-to-horizontal").scrollTo("50%").then(function($el) {
          //# they don't calculate the height of the container
          //# in the percentage of the scroll (since going the height
          //# of the container wouldn't scroll at all...)
          expect(this.scrollHoriz.get(0).scrollTop).to.eq(0);
          return expect(this.scrollHoriz.get(0).scrollLeft).to.eq((500-100)/2);
        });
      });
    });

    describe("position arguments", function() {
      it("scrolls x/y axis to topLeft", function() {
        expect(this.scrollBoth.get(0).scrollTop).to.eq(0);
        expect(this.scrollBoth.get(0).scrollLeft).to.eq(0);

        return cy.get("#scroll-to-both").scrollTo("topLeft").then(function() {
          expect(this.scrollBoth.get(0).scrollTop).to.eq(0);
          return expect(this.scrollBoth.get(0).scrollLeft).to.eq(0);
        });
      });

      it("scrolls x/y axis to top", function() {
        expect(this.scrollBoth.get(0).scrollTop).to.eq(0);
        expect(this.scrollBoth.get(0).scrollLeft).to.eq(0);

        return cy.get("#scroll-to-both").scrollTo("top").then(function() {
          expect(this.scrollBoth.get(0).scrollTop).to.eq(0);
          return expect(this.scrollBoth.get(0).scrollLeft).to.eq((500-100)/2);
        });
      });

      it("scrolls x/y axis to topRight", function() {
        expect(this.scrollBoth.get(0).scrollTop).to.eq(0);
        expect(this.scrollBoth.get(0).scrollLeft).to.eq(0);

        return cy.get("#scroll-to-both").scrollTo("topRight").then(function() {
          expect(this.scrollBoth.get(0).scrollTop).to.eq(0);
          return expect(this.scrollBoth.get(0).scrollLeft).to.eq((500-100));
        });
      });

      it("scrolls x/y axis to left", function() {
        expect(this.scrollBoth.get(0).scrollTop).to.eq(0);
        expect(this.scrollBoth.get(0).scrollLeft).to.eq(0);

        return cy.get("#scroll-to-both").scrollTo("left").then(function() {
          expect(this.scrollBoth.get(0).scrollTop).to.eq((500-100)/2);
          return expect(this.scrollBoth.get(0).scrollLeft).to.eq(0);
        });
      });

      it("scrolls x/y axis to center", function() {
        expect(this.scrollBoth.get(0).scrollTop).to.eq(0);
        expect(this.scrollBoth.get(0).scrollLeft).to.eq(0);

        return cy.get("#scroll-to-both").scrollTo("center").then(function() {
          expect(this.scrollBoth.get(0).scrollTop).to.eq((500-100)/2);
          return expect(this.scrollBoth.get(0).scrollLeft).to.eq((500-100)/2);
        });
      });

      it("scrolls x/y axis to right", function() {
        expect(this.scrollBoth.get(0).scrollTop).to.eq(0);
        expect(this.scrollBoth.get(0).scrollLeft).to.eq(0);

        return cy.get("#scroll-to-both").scrollTo("right").then(function() {
          expect(this.scrollBoth.get(0).scrollTop).to.eq((500-100)/2);
          return expect(this.scrollBoth.get(0).scrollLeft).to.eq((500-100));
        });
      });

      it("scrolls x/y axis to bottomLeft", function() {
        expect(this.scrollBoth.get(0).scrollTop).to.eq(0);
        expect(this.scrollBoth.get(0).scrollLeft).to.eq(0);

        return cy.get("#scroll-to-both").scrollTo("bottomLeft").then(function() {
          expect(this.scrollBoth.get(0).scrollTop).to.eq((500-100));
          return expect(this.scrollBoth.get(0).scrollLeft).to.eq(0);
        });
      });

      it("scrolls x/y axis to bottom", function() {
        expect(this.scrollBoth.get(0).scrollTop).to.eq(0);
        expect(this.scrollBoth.get(0).scrollLeft).to.eq(0);

        return cy.get("#scroll-to-both").scrollTo("bottom").then(function() {
          expect(this.scrollBoth.get(0).scrollTop).to.eq((500-100));
          return expect(this.scrollBoth.get(0).scrollLeft).to.eq((500-100)/2);
        });
      });

      return it("scrolls x/y axis to bottomRight", function() {
        expect(this.scrollBoth.get(0).scrollTop).to.eq(0);
        expect(this.scrollBoth.get(0).scrollLeft).to.eq(0);

        return cy.get("#scroll-to-both").scrollTo("bottomRight").then(function() {
          expect(this.scrollBoth.get(0).scrollTop).to.eq((500-100));
          return expect(this.scrollBoth.get(0).scrollLeft).to.eq((500-100));
        });
      });
    });

    describe("scroll both axis", function() {
      it("scrolls both x and y axis num of px", function() {
        expect(this.scrollBoth.get(0).scrollTop).to.eq(0);
        expect(this.scrollBoth.get(0).scrollLeft).to.eq(0);

        return cy.get("#scroll-to-both").scrollTo(300, 150).then(function($el) {
          expect(this.scrollBoth.get(0).scrollTop).to.eq(150);
          return expect(this.scrollBoth.get(0).scrollLeft).to.eq(300);
        });
      });

      it("scrolls x to 0 and y num of px", function() {
        expect(this.scrollBoth.get(0).scrollTop).to.eq(0);
        expect(this.scrollBoth.get(0).scrollLeft).to.eq(0);

        return cy.get("#scroll-to-both").scrollTo(0, 150).then(function($el) {
          expect(this.scrollBoth.get(0).scrollTop).to.eq(150);
          return expect(this.scrollBoth.get(0).scrollLeft).to.eq(0);
        });
      });

      it("scrolls x num of px and y to 0 ", function() {
        expect(this.scrollBoth.get(0).scrollTop).to.eq(0);
        expect(this.scrollBoth.get(0).scrollLeft).to.eq(0);

        return cy.get("#scroll-to-both").scrollTo(150, 0).then(function($el) {
          expect(this.scrollBoth.get(0).scrollTop).to.eq(0);
          return expect(this.scrollBoth.get(0).scrollLeft).to.eq(150);
        });
      });

      it("scrolls both x and y axis of px", function() {
        expect(this.scrollBoth.get(0).scrollTop).to.eq(0);
        expect(this.scrollBoth.get(0).scrollLeft).to.eq(0);

        return cy.get("#scroll-to-both").scrollTo("300px", "150px").then(function($el) {
          expect(this.scrollBoth.get(0).scrollTop).to.eq(150);
          return expect(this.scrollBoth.get(0).scrollLeft).to.eq(300);
        });
      });

      it("scrolls both x and y axis of percentage", function() {
        expect(this.scrollBoth.get(0).scrollTop).to.eq(0);
        expect(this.scrollBoth.get(0).scrollLeft).to.eq(0);

        return cy.get("#scroll-to-both").scrollTo("50%", "50%").then(function($el) {
          expect(this.scrollBoth.get(0).scrollTop).to.eq((500-100)/2);
          return expect(this.scrollBoth.get(0).scrollLeft).to.eq((500-100)/2);
        });
      });

      it("scrolls x to 0 and y percentage", function() {
        expect(this.scrollBoth.get(0).scrollTop).to.eq(0);
        expect(this.scrollBoth.get(0).scrollLeft).to.eq(0);

        return cy.get("#scroll-to-both").scrollTo("0%", "50%").then(function($el) {
          expect(this.scrollBoth.get(0).scrollTop).to.eq((500-100)/2);
          return expect(this.scrollBoth.get(0).scrollLeft).to.eq(0);
        });
      });

      return it("scrolls x to percentage and y to 0", function() {
        expect(this.scrollBoth.get(0).scrollTop).to.eq(0);
        expect(this.scrollBoth.get(0).scrollLeft).to.eq(0);

        return cy.get("#scroll-to-both").scrollTo("50%", "0%").then(function($el) {
          expect(this.scrollBoth.get(0).scrollTop).to.eq(0);
          return expect(this.scrollBoth.get(0).scrollLeft).to.eq((500-100)/2);
        });
      });
    });

    describe("scrolls with options", function() {
      it("calls jQuery scroll to", function() {
        const scrollTo = cy.spy($.fn, "scrollTo");

        return cy.get("#scroll-to-both").scrollTo("25px").then(() => expect(scrollTo).to.be.calledWith({left: "25px", top: 0}));
      });

      it("sets duration to 0 by default", function() {
        const scrollTo = cy.spy($.fn, "scrollTo");

        return cy.get("#scroll-to-both").scrollTo("25px").then(() => expect(scrollTo).to.be.calledWithMatch({}, {duration: 0}));
      });

      it("sets axis to correct xy", function() {
        const scrollTo = cy.spy($.fn, "scrollTo");

        return cy.get("#scroll-to-both").scrollTo("25px", "80px").then(() => expect(scrollTo).to.be.calledWithMatch({}, {axis: "xy"}));
      });

      it("scrolling resolves after a set duration", function() {
        expect(this.scrollHoriz.get(0).scrollTop).to.eq(0);
        expect(this.scrollHoriz.get(0).scrollLeft).to.eq(0);

        const scrollTo = cy.spy($.fn, "scrollTo");

        return cy.get("#scroll-to-horizontal").scrollTo("125px", {duration: 500}).then(function() {
          expect(scrollTo).to.be.calledWithMatch({}, {duration: 500});
          expect(this.scrollHoriz.get(0).scrollTop).to.eq(0);
          return expect(this.scrollHoriz.get(0).scrollLeft).to.eq(125);
        });
      });

      it("accepts duration string option", function() {
        const scrollTo = cy.spy($.fn, "scrollTo");

        return cy.get("#scroll-to-both").scrollTo("25px", {duration: "500"}).then(() => expect(scrollTo.args[0][1].duration).to.eq("500"));
      });

      it("has easing set to swing by default", function() {
        const scrollTo = cy.spy($.fn, "scrollTo");

        return cy.get("#scroll-to-both").scrollTo("25px").then(() => expect(scrollTo.args[0][1].easing).to.eq("swing"));
      });

      it("scrolling resolves after easing", function() {
        expect(this.scrollBoth.get(0).scrollTop).to.eq(0);
        expect(this.scrollBoth.get(0).scrollLeft).to.eq(0);

        const scrollTo = cy.spy($.fn, "scrollTo");

        return cy.get("#scroll-to-both").scrollTo("25px", "50px", {easing: "linear"}).then(function() {
          expect(scrollTo).to.be.calledWithMatch({}, {easing: "linear"});
          expect(this.scrollBoth.get(0).scrollTop).to.eq(50);
          return expect(this.scrollBoth.get(0).scrollLeft).to.eq(25);
        });
      });

      return it("retries until element is scrollable", function() {
        const $container = cy.$$("#nonscroll-becomes-scrollable");

        expect($container.get(0).scrollTop).to.eq(0);
        expect($container.get(0).scrollLeft).to.eq(0);

        let retried = false;

        cy.on("command:retry", _.after(2, function() {
          $container.css("overflow", "scroll");
          return retried = true;
        })
        );

        return cy.get("#nonscroll-becomes-scrollable").scrollTo(500, 300).then(function() {
          expect(retried).to.be.true;
          expect($container.get(0).scrollTop).to.eq(300);
          return expect($container.get(0).scrollLeft).to.eq(500);
        });
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

      it("eventually passes the assertion", function() {
        cy.on("command:retry", _.after(2, () => cy.$$("#scroll-into-view-horizontal").addClass("scrolled"))
        );

        return cy
          .get("#scroll-into-view-horizontal")
          .scrollTo("right")
          .should("have.class", "scrolled").then(function() {
            const {
              lastLog
            } = this;

            expect(lastLog.get("name")).to.eq("assert");
            expect(lastLog.get("state")).to.eq("passed");
            return expect(lastLog.get("ended")).to.be.true;
        });
      });

      return it("waits until the subject is scrollable", function() {
        cy.stub(cy, "ensureScrollability")
        .onFirstCall().throws(new Error());

        cy.on("command:retry", () => cy.ensureScrollability.returns());

        return cy
          .get("#scroll-into-view-horizontal")
          .scrollTo("right").then(() => expect(cy.ensureScrollability).to.be.calledTwice);
      });
    });

    describe("errors", function() {
      beforeEach(function() {
        Cypress.config("defaultCommandTimeout", 50);

        this.logs = [];

        cy.on("log:added", (attrs, log) => {
          this.lastLog = log;
          return this.logs.push(log);
        });

        return null;
      });

      it("throws when subject isn't scrollable", function(done) {
        cy.on("fail", err => {
          expect(err.message).to.include("`cy.scrollTo()` failed because this element is not scrollable:");
          return done();
        });

        return cy.get("button:first").scrollTo("bottom");
      });

      context("subject errors", function() {
        it("throws when not passed DOM element as subject", function(done) {
          cy.on("fail", err => {
            expect(err.message).to.include("`cy.scrollTo()` failed because it requires a DOM element.");
            expect(err.message).to.include("{foo: bar}");
            expect(err.message).to.include("> `cy.noop()`");
            return done();
          });

          return cy.noop({foo: "bar"}).scrollTo("250px");
        });

        return it("throws if scrollable container is multiple elements", function(done) {
          cy.on("fail", err => {
            expect(err.message).to.include("`cy.scrollTo()` can only be used to scroll 1 element, you tried to scroll 2 elements.");
            expect(err.docsUrl).to.eq("https://on.cypress.io/scrollto");
            return done();
          });

          return cy.get("button").scrollTo("500px");
        });
      });

      context("argument errors", function() {
        it("throws if no args passed", function(done) {
          cy.on("fail", err => {
            expect(err.message).to.include("`cy.scrollTo()` must be called with a valid `position`. It can be a string, number or object.");
            expect(err.docsUrl).to.eq("https://on.cypress.io/scrollto");
            return done();
          });

          return cy.scrollTo();
        });

        it("throws if NaN", function(done) {
          cy.on("fail", err => {
            expect(err.message).to.include("`cy.scrollTo()` must be called with a valid `position`. It can be a string, number or object. Your position was: `25, NaN`");
            expect(err.docsUrl).to.eq("https://on.cypress.io/scrollto");
            return done();
          });

          return cy.get("#scroll-to-both").scrollTo(25, 0/0);
        });

        it("throws if Infinity", function(done) {
          cy.on("fail", err => {
            expect(err.message).to.include("`cy.scrollTo()` must be called with a valid `position`. It can be a string, number or object. Your position was: `25, Infinity`");
            expect(err.docsUrl).to.eq("https://on.cypress.io/scrollto");
            return done();
          });

          return cy.get("#scroll-to-both").scrollTo(25, 10/0);
        });

        return it("throws if unrecognized position", function(done) {
          cy.on("fail", err => {
            expect(err.message).to.include("Invalid position argument: `botom`. Position may only be topLeft, top, topRight, left, center, right, bottomLeft, bottom, bottomRight.");
            return done();
          });

          return cy.get("#scroll-to-both").scrollTo("botom");
        });
      });

      return context("option errors", function() {
        it("throws if duration is not a number or valid string", function(done) {
          cy.on("fail", err => {
            expect(err.message).to.include("`cy.scrollTo()` must be called with a valid `duration`. Duration may be either a number (ms) or a string representing a number (ms). Your duration was: `foo`");
            expect(err.docsUrl).to.eq("https://on.cypress.io/scrollto");
            return done();
          });

          return cy.get("#scroll-to-both").scrollTo("25px", { duration: "foo" });
        });

        return it("throws if unrecognized easing", function(done) {
          cy.on("fail", err => {
            expect(err.message).to.include("`cy.scrollTo()` must be called with a valid `easing`. Your easing was: `flower`");
            expect(err.docsUrl).to.eq("https://on.cypress.io/scrollto");
            return done();
          });

          return cy.get("#scroll-to-both").scrollTo("25px", { easing: "flower" });
        });
      });
    });

    return describe(".log", function() {
      beforeEach(function() {
        this.logs = [];

        cy.on("log:added", (attrs, log) => {
          this.lastLog = log;
          return this.logs.push(log);
        });

        return null;
      });

      it("logs out scrollTo", () => cy.get("#scroll-to-both").scrollTo(25).then(function() {
        const {
          lastLog
        } = this;

        return expect(lastLog.get("name")).to.eq("scrollTo");
      }));

      it("passes in $el if child command", () => cy.get("#scroll-to-both").scrollTo(25).then(function($container) {
        const {
          lastLog
        } = this;

        return expect(lastLog.get("$el").get(0)).to.eq($container.get(0));
      }));

      it("passes undefined in $el if parent command", () => cy.scrollTo(25).then(function($container) {
        const {
          lastLog
        } = this;

        return expect(lastLog.get("$el")).to.be.undefined;
      }));

      it("logs duration options", () => cy.get("#scroll-to-both").scrollTo(25, { duration: 1 }).then(function() {
        const {
          lastLog
        } = this;

        return expect(lastLog.get("message")).to.eq("25, 0, {duration: 1}");
      }));

      it("logs easing options", () => cy.get("#scroll-to-both").scrollTo(25, { easing: 'linear' }).then(function() {
        const {
          lastLog
        } = this;

        return expect(lastLog.get("message")).to.eq("25, 0, {easing: linear}");
      }));

      it("snapshots immediately", () => cy.get("#scroll-to-both").scrollTo(25, { duration: 1 }).then(function() {
        const {
          lastLog
        } = this;

        expect(lastLog.get("snapshots").length).to.eq(1);
        return expect(lastLog.get("snapshots")[0]).to.be.an("object");
      }));

      return it("#consoleProps", () => cy.get("#scroll-to-both").scrollTo(25, {duration: 1}).then(function($container) {
        const console = this.lastLog.invoke("consoleProps");
        expect(console.Command).to.eq("scrollTo");
        expect(console.X).to.eq(25);
        expect(console.Y).to.eq(0);
        expect(console.Options).to.eq("{duration: 1}");
        return expect(console["Scrolled Element"]).to.eq($container.get(0));
      }));
    });
  });

  return context("#scrollIntoView", function() {
    beforeEach(function() {
      this.win          = cy.state("window");
      this.scrollVert   = cy.$$("#scroll-into-view-vertical");
      this.scrollHoriz  = cy.$$("#scroll-into-view-horizontal");
      this.scrollBoth   = cy.$$("#scroll-into-view-both");

      //# reset the scrollable containers back
      //# to furthest left and top
      this.win.scrollTo(0, 0);

      this.scrollVert.scrollTop(0);
      this.scrollVert.scrollLeft(0);

      this.scrollHoriz.scrollTop(0);
      this.scrollHoriz.scrollLeft(0);

      this.scrollBoth.scrollTop(0);
      return this.scrollBoth.scrollLeft(0);
    });

    it("does not change the subject", function() {
      const div = cy.$$("#scroll-into-view-vertical div");

      return cy.get("#scroll-into-view-vertical div").scrollIntoView().then($div => expect($div).to.match(div));
    });

    it("scrolls x axis of window to element", function() {
      expect(this.win.scrollY).to.eq(0);
      expect(this.win.scrollX).to.eq(0);

      cy.get("#scroll-into-view-win-horizontal div").scrollIntoView();
      return cy.window().then(function(win) {
        expect(win.scrollY).to.eq(0);
        return expect(win.scrollX).not.to.eq(0);
      });
    });

    it("scrolls y axis of window to element", function() {
      expect(this.win.scrollY).to.eq(0);
      expect(this.win.scrollX).to.eq(0);

      cy.get("#scroll-into-view-win-vertical div").scrollIntoView();
      return cy.window().then(function(win) {
        expect(win.pageYOffset).not.to.eq(0);
        return expect(Math.floor(win.pageXOffset)).closeTo(200, 2);
      });
    });

    it("scrolls both axes of window to element", function() {
      expect(this.win.scrollY).to.eq(0);
      expect(this.win.scrollX).to.eq(0);

      cy.get("#scroll-into-view-win-both div").scrollIntoView();
      return cy.window().then(function(win) {
        expect(win.scrollY).not.to.eq(0);
        return expect(win.scrollX).not.to.eq(0);
      });
    });

    it("scrolls x axis of container to element", function() {
      expect(this.scrollHoriz.get(0).scrollTop).to.eq(0);
      expect(this.scrollHoriz.get(0).scrollLeft).to.eq(0);

      return cy.get("#scroll-into-view-horizontal h5").scrollIntoView().then(function($el) {
        expect(this.scrollHoriz.get(0).scrollTop).to.eq(0);
        return expect(this.scrollHoriz.get(0).scrollLeft).to.eq(300);
      });
    });

    it("scrolls y axis of container to element", function() {
      expect(this.scrollVert.get(0).scrollTop).to.eq(0);
      expect(this.scrollVert.get(0).scrollLeft).to.eq(0);

      return cy.get("#scroll-into-view-vertical h5").scrollIntoView().then(function($el) {
        expect(this.scrollVert.get(0).scrollTop).to.eq(300);
        return expect(this.scrollVert.get(0).scrollLeft).to.eq(0);
      });
    });

    it("scrolls both axes of container to element", function() {
      expect(this.scrollBoth.get(0).scrollTop).to.eq(0);
      expect(this.scrollBoth.get(0).scrollLeft).to.eq(0);

      return cy.get("#scroll-into-view-both h5").scrollIntoView().then(function($el) {
        expect(this.scrollBoth.get(0).scrollTop).to.eq(300);
        return expect(this.scrollBoth.get(0).scrollLeft).to.eq(300);
      });
    });

    it("calls jQuery scroll to", function() {
      const scrollTo = cy.spy($.fn, "scrollTo");

      return cy.get("#scroll-into-view-both h5").scrollIntoView().then(() => expect(scrollTo).to.be.called);
    });

    it("sets duration to 0 by default", function() {
      const scrollTo = cy.spy($.fn, "scrollTo");

      return cy.get("#scroll-into-view-both h5").scrollIntoView().then(() => expect(scrollTo).to.be.calledWithMatch({}, {duration: 0}));
    });

    it("sets axis to correct x or y", function() {
      const scrollTo = cy.spy($.fn, "scrollTo");

      return cy.get("#scroll-into-view-both h5").scrollIntoView().then(() => expect(scrollTo).to.be.calledWithMatch({}, {axis: "xy"}));
    });

    it("scrolling resolves after a set duration", function() {
      expect(this.scrollBoth.get(0).scrollTop).to.eq(0);
      expect(this.scrollBoth.get(0).scrollLeft).to.eq(0);

      const scrollTo = cy.spy($.fn, "scrollTo");

      return cy.get("#scroll-into-view-both h5").scrollIntoView({duration: 500}).then(function() {
        expect(scrollTo).to.be.calledWithMatch({}, {duration: 500});
        expect(this.scrollBoth.get(0).scrollLeft).to.eq(300);
        return expect(this.scrollBoth.get(0).scrollTop).to.eq(300);
      });
    });

    it("accepts duration string option", function() {
      const scrollTo = cy.spy($.fn, "scrollTo");

      return cy.get("#scroll-into-view-both h5").scrollIntoView({duration: "500"}).then(() => expect(scrollTo.args[0][1].duration).to.eq("500"));
    });

    it("accepts offset string option", function() {
      const scrollTo = cy.spy($.fn, "scrollTo");

      return cy.get("#scroll-into-view-both h5").scrollIntoView({offset: 500}).then(() => expect(scrollTo.args[0][1].offset).to.eq(500));
    });

    it("accepts offset object option", function() {
      const scrollTo = cy.spy($.fn, "scrollTo");

      return cy.get("#scroll-into-view-both h5").scrollIntoView({offset: {left: 500, top: 200}}).then(() => expect(scrollTo.args[0][1].offset).to.deep.eq({left: 500, top: 200}));
  });

    it("has easing set to swing by default", function() {
      const scrollTo = cy.spy($.fn, "scrollTo");

      return cy.get("#scroll-into-view-both h5").scrollIntoView().then(() => expect(scrollTo.args[0][1].easing).to.eq("swing"));
    });

    it("scrolling resolves after easing", function() {
      expect(this.scrollBoth.get(0).scrollTop).to.eq(0);
      expect(this.scrollBoth.get(0).scrollLeft).to.eq(0);

      const scrollTo = cy.spy($.fn, "scrollTo");

      return cy.get("#scroll-into-view-both h5").scrollIntoView({easing: "linear"}).then(function() {
        expect(scrollTo).to.be.calledWithMatch({}, {easing: "linear"});
        expect(this.scrollBoth.get(0).scrollTop).to.eq(300);
        return expect(this.scrollBoth.get(0).scrollLeft).to.eq(300);
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
        cy.on("command:retry", _.after(2, () => cy.$$("#scroll-into-view-win-vertical div").addClass("scrolled"))
        );

        return cy
          .contains("scroll into view vertical")
          .scrollIntoView()
          .should("have.class", "scrolled").then(function() {
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
        Cypress.config("defaultCommandTimeout", 50);

        this.logs = [];

        cy.on("log:added", (attrs, log) => {
          this.lastLog = log;
          return this.logs.push(log);
        });

        return null;
      });

      context("subject errors", function() {
        it("throws when not passed DOM element as subject", function(done) {
          cy.on("fail", err => {
            expect(err.message).to.include("`cy.scrollIntoView()` failed because it requires a DOM element.");
            expect(err.message).to.include("{foo: bar}");
            expect(err.message).to.include("> `cy.noop()`");
            return done();
          });

          return cy.noop({foo: "bar"}).scrollIntoView();
        });

        it("throws when passed window object as subject", function(done) {
          cy.on("fail", err => {
            expect(err.message).to.include("`cy.scrollIntoView()` failed because it requires a DOM element.");
            expect(err.message).to.include("<window>");
            expect(err.message).to.include("> `cy.window()`");
            return done();
          });

          return cy.window().scrollIntoView();
        });

        it("throws when passed document object as subject", function(done) {
          cy.on("fail", err => {
            expect(err.message).to.include("`cy.scrollIntoView()` failed because it requires a DOM element.");
            expect(err.message).to.include("<document>");
            expect(err.message).to.include("> `cy.document()`");
            return done();
          });

          return cy.document().scrollIntoView();
        });

        return it("throws if scrollable container is multiple elements", function(done) {
          cy.on("fail", err => {
            expect(err.message).to.include("`cy.scrollIntoView()` can only be used to scroll to 1 element, you tried to scroll to 2 elements.");
            expect(err.docsUrl).to.include("https://on.cypress.io/scrollintoview");
            return done();
          });

          return cy.get("button").scrollIntoView();
        });
      });

      context("argument errors", () => it("throws if arg passed as non-object", function(done) {
        cy.on("fail", err => {
          expect(err.message).to.include("`cy.scrollIntoView()` can only be called with an `options` object. Your argument was: `foo`");
          expect(err.docsUrl).to.eq("https://on.cypress.io/scrollintoview");
          return done();
        });

        return cy.get("#scroll-into-view-both h5").scrollIntoView("foo");
      }));

      return context("option errors", function() {
        it("throws if duration is not a number or valid string", function(done) {
          cy.on("fail", err => {
            expect(err.message).to.include("`cy.scrollIntoView()` must be called with a valid `duration`. Duration may be either a number (ms) or a string representing a number (ms). Your duration was: `foo`");
            expect(err.docsUrl).to.include("https://on.cypress.io/scrollintoview");
            return done();
          });

          return cy.get("#scroll-into-view-both h5").scrollIntoView({ duration: "foo" });
        });

        return it("throws if unrecognized easing", function(done) {
          cy.on("fail", err => {
            expect(err.message).to.include("`cy.scrollIntoView()` must be called with a valid `easing`. Your easing was: `flower`");
            expect(err.docsUrl).to.include("https://on.cypress.io/scrollintoview");
            return done();
          });

          return cy.get("#scroll-into-view-both h5").scrollIntoView({ easing: "flower" });
        });
      });
    });

    return describe(".log", function() {
      beforeEach(function() {
        this.logs = [];

        cy.on("log:added", (attrs, log) => {
          this.lastLog = log;
          return this.logs.push(log);
        });

        return null;
      });

      it("logs out scrollIntoView", () => cy.get("#scroll-into-view-both h5").scrollIntoView().then(function() {
        const {
          lastLog
        } = this;

        return expect(lastLog.get("name")).to.eq("scrollIntoView");
      }));

      it("passes in $el", () => cy.get("#scroll-into-view-both h5").scrollIntoView().then(function($container) {
        const {
          lastLog
        } = this;

        return expect(lastLog.get("$el").get(0)).to.eq($container.get(0));
      }));

      it("logs duration options", () => cy.get("#scroll-into-view-both h5").scrollIntoView({duration: "1"}).then(function() {
        const {
          lastLog
        } = this;

        return expect(lastLog.get("message")).to.eq("{duration: 1}");
      }));

      it("logs easing options", () => cy.get("#scroll-into-view-both h5").scrollIntoView({easing: "linear"}).then(function() {
        const {
          lastLog
        } = this;

        return expect(lastLog.get("message")).to.eq("{easing: linear}");
      }));

      it("logs offset options", () => cy.get("#scroll-into-view-both h5").scrollIntoView({offset: {left: 500, top: 200}}).then(function() {
        const {
          lastLog
        } = this;

        return expect(lastLog.get("message")).to.eq("{offset: {left: 500, top: 200}}");
      }));

      it("snapshots immediately", () => cy.get("#scroll-into-view-both h5").scrollIntoView().then(function() {
        const {
          lastLog
        } = this;

        expect(lastLog.get("snapshots").length).to.eq(1);
        return expect(lastLog.get("snapshots")[0]).to.be.an("object");
      }));

      return it("#consoleProps", () => cy.get("#scroll-into-view-both h5").scrollIntoView().then(function($container) {
        const console = this.lastLog.invoke("consoleProps");
        expect(console.Command).to.eq("scrollIntoView");
        expect(console["Applied To"]).to.eq($container.get(0));
        return expect(console["Scrolled Element"]).to.exist;
      }));
    });
  });
});
