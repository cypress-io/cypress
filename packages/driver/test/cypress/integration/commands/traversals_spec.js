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
  dom
} = Cypress;

const helpers = require("../../support/helpers");

describe("src/cy/commands/traversals", function() {
  beforeEach(() => cy.visit("/fixtures/dom.html"));

  const fns = [
    {find: "*"},
    {filter: ":first"},
    {filter(i) { return i === 0; }},
    {not: "div"},
    {not(i, e) { return e.tagName === 'div'; }},
    {eq: 0},
    {closest: "body"},
    "children", "first", "last", "next", "nextAll", "nextUntil", "parent", "parents", "parentsUntil", "prev", "prevAll", "prevUntil", "siblings"
  ];
  _.each(fns, function(fn) {
    //# normalize string vs object
    let arg, name;
    if (_.isObject(fn)) {
      name = _.keys(fn)[0];
      arg = fn[name];
    } else {
      name = fn;
    }

    return context(`#${name}`, function() {
      it("proxies through to jquery and returns new subject", function() {
        const el = cy.$$("#list")[name](arg);
        return cy.get("#list")[name](arg).then($el => expect($el).to.match(el));
      });

      describe("errors", function() {
        beforeEach(() => Cypress.config("defaultCommandTimeout", 100));

        it("throws when options.length isnt a number", function(done) {
          cy.on("fail", function(err) {
            expect(err.message).to.include("You must provide a valid number to a `length` assertion. You passed: `asdf`");
            return done();
          });

          return cy.get("#list")[name](arg).should("have.length", "asdf");
        });

        it("throws on too many elements after timing out waiting for length", function(done) {
          const el = cy.$$("#list")[name](arg);

          const node = dom.stringify(cy.$$("#list"), "short");

          cy.on("fail", function(err) {
            expect(err.message).to.include(`Too many elements found. Found '${el.length}', expected '${el.length - 1}'.`);
            return done();
          });

          return cy.get("#list")[name](arg).should("have.length", el.length - 1);
        });

        it("throws on too few elements after timing out waiting for length", function(done) {
          const el = cy.$$("#list")[name](arg);

          const node = dom.stringify(cy.$$("#list"), "short");

          cy.on("fail", function(err) {
            expect(err.message).to.include(`Not enough elements found. Found '${el.length}', expected '${el.length + 1}'.`);
            return done();
          });

          return cy.get("#list")[name](arg).should("have.length", el.length + 1);
        });

        it("without a dom element", function(done) {
          cy.on("fail", () => done());
          return cy.noop({})[name](arg);
        });

        it("throws when subject is not in the document", function(done) {
          cy.on("command:end", () => {
            return cy.$$("#list").remove();
          });

          cy.on("fail", function(err) {
            expect(err.message).to.include(`\`cy.${name}()\` failed because this element`);
            return done();
          });

          return cy.get("#list")[name](arg);
        });

        return it("returns no elements", function(done) {
          const errIncludes = (el, node) => {
            node = dom.stringify(cy.$$(node), "short");

            return cy.on("fail", function(err) {
              expect(err.message).to.include(`Expected to find element: \`${el}\`, but never found it. Queried from element: ${node}`);
              return done();
            });
          };

          switch (name) {
            case "not":
              errIncludes(":checkbox", ":checkbox");
              return cy.get(":checkbox").not(":checkbox");

            //# these cannot error
            case "first": case "last": case "parentsUntil": return done();

            default:
              errIncludes(".no-class-like-this-exists", "div:first");
              return cy.get("div:first")[name](".no-class-like-this-exists");
          }
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
          cy.on("log:added", function(attrs, log) {
            if (log.get("name") === name) {
              expect(log.pick("state")).to.deep.eq({
                state: "pending"
              });
              return done();
            }
          });

          return cy.get("#list")[name](arg);
        });

        it("snapshots after finding element", () => cy.get("#list")[name](arg).then(function() {
          const {
            lastLog
          } = this;

          expect(lastLog.get("snapshots").length).to.eq(1);
          return expect(lastLog.get("snapshots")[0]).to.be.an("object");
        }));

        it("has the $el", () => cy.get("#list")[name](arg).then(function($el) {
          const {
            lastLog
          } = this;

          return expect(lastLog.get("$el").get(0)).to.eq($el.get(0));
        }));

        it("has a custom message", () => cy.get("#list")[name](arg).then(function() {
          let message;
          if (_.isUndefined(arg) || _.isFunction(arg)) {
            message = "";
          } else {
            message = arg.toString();
          }

          const {
            lastLog
          } = this;

          return expect(lastLog.get("message")).to.eq(message);
        }));

        it("#consoleProps", () => cy.get("#list")[name](arg).then(function($el) {
          const obj = {Command: name};
          if (_.isFunction(arg)) {
            obj.Selector = "";
          } else {
            obj.Selector = [].concat(arg).join(", ");
          }

          const yielded = Cypress.dom.getElements($el);

          _.extend(obj, {
            "Applied To": helpers.getFirstSubjectByName("get").get(0),
            Yielded: yielded,
            Elements: $el.length
          });

          return expect(this.lastLog.invoke("consoleProps")).to.deep.eq(obj);
        }));

        return it("can be turned off", () => cy.get("#list")[name](arg, {log: false}).then(function() {
          const {
            lastLog
          } = this;

          return expect(lastLog.get("name")).to.eq("get");
        }));
      });
    });
  });

  it("eventually resolves", function() {
    cy.on("command:retry", _.after(2, () => cy.$$("button:first").text("foo").addClass("bar"))
    );

    return cy.root().find("button:first").should("have.text", "foo").and("have.class", "bar");
  });

  it("retries until it finds", function() {
    const li = cy.$$("#list li:last");
    const span = $("<span>foo</span>");

    const retry = _.after(3, () => li.append(span));

    cy.on("command:retry", retry);

    return cy.get("#list li:last").find("span").then($span => expect($span.get(0)).to.eq(span.get(0)));
  });

  it("retries until length equals n", function() {
    let buttons = cy.$$("button");

    const length = buttons.length - 2;

    cy.on("command:retry", _.after(2, () => {
      buttons.last().remove();
      return buttons = cy.$$("button");
    })
    );

    //# should resolving after removing 2 buttons
    return cy.root().find("button").should("have.length", length).then($buttons => expect($buttons.length).to.eq(length));
  });

  it("should('not.exist')", function() {
    cy.on("command:retry", _.after(3, () => {
      return cy.$$("#nested-div").find("span").remove();
    })
    );

    return cy.get("#nested-div").find("span").should("not.exist");
  });

  it("should('exist')", function() {
    cy.on("command:retry", _.after(3, () => {
      return cy.$$("#nested-div").append($("<strong />"));
    })
    );

    return cy.get("#nested-div").find("strong");
  });

  //# https://github.com/cypress-io/cypress/issues/38
  it("works with checkboxes", function() {
    cy.on("command:retry", _.after(2, () => {
      const c = cy.$$("[name=colors]").slice(0, 2);
      return c.prop("checked", true);
    })
    );

    return cy.get("#by-name").find(":checked").should("have.length", 2);
  });

  it("does not log using first w/options", function() {
    const logs = [];

    cy.on("log:added", function(attrs, log) {
      if (attrs.name !== "assert") {
        return logs.push(log);
      }
    });

    return cy.get("button").first({log: false}).then(function($button) {
      expect($button.length).to.eq(1);
      return expect(logs.length).to.eq(1);
    });
  });

  return describe("errors", function() {
    beforeEach(function() {
      Cypress.config("defaultCommandTimeout", 100);

      this.logs = [];

      cy.on("log:added", (attrs, log) => {
        return this.logs.push(log);
      });

      return null;
    });

    it("errors after timing out not finding element", function(done) {
      cy.on("fail", function(err) {
        expect(err.message).to.include("Expected to find element: `span`, but never found it. Queried from element: <li.item>");
        return done();
      });

      return cy.get("#list li:last").find("span");
    });

    it("throws once when incorrect sizzle selector", function(done) {
      cy.on("fail", err => {
        expect(this.logs.length).to.eq(2);
        return done();
      });

      return cy.get("div:first").find(".spinner'");
    });

    return it("logs out $el when existing $el is found even on failure", function(done) {
      const button = cy.$$("#button").hide();

      cy.on("fail", err => {
        const log = this.logs[1];

        expect(log.get("state")).to.eq("failed");
        expect(err.message).to.include(log.get("error").message);
        expect(log.get("$el").get(0)).to.eq(button.get(0));

        const consoleProps = log.invoke("consoleProps");
        expect(consoleProps.Yielded).to.eq(button.get(0));
        expect(consoleProps.Elements).to.eq(button.length);
        return done();
      });

      return cy.get("#dom").find("#button").should("be.visible");
    });
  });
});
