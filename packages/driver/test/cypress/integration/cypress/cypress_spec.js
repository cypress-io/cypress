/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {
  $
} = Cypress;
const {
  Promise
} = Cypress;

describe("driver/src/cypress/index", function() {
  beforeEach(function() {
    cy.stub(Promise, "config");

    return this.Cypress = Cypress.$Cypress.create({});
  });

  context("$Cypress", () => it("is attached but not global", function() {
    expect(window.$Cypress).to.be.undefined;
    return expect(window.top.$Cypress).to.be.undefined;
  }));

  context("$", function() {
    afterEach(() => delete Cypress.$.expr[":"].foo);

    //# https://github.com/cypress-io/cypress/issues/2830
    return it("exposes expr", function() {
      expect(Cypress.$).to.have.property("expr");

      Cypress.$.expr[":"].foo = elem => Boolean(elem.getAttribute("foo"));

      const $foo = $("<div foo='bar'>foo element</div>").appendTo(cy.$$("body"));

      return cy.get(":foo").then($el => expect($el.get(0)).to.eq($foo.get(0)));
    });
  });

  context("#backend", function() {
    it("sets __stackCleaned__ on errors", function() {
      cy.stub(this.Cypress, "emit")
      .withArgs("backend:request")
      .yieldsAsync({
        error: {
          name: "Error",
          message: "msg",
          stack: "stack"
        }
      });

      return this.Cypress.backend("foo")
      .catch(function(err) {
        expect(err.backend).to.be.true;
        return expect(err.stack).not.to.include("From previous event");
      });
    });

    //# https://github.com/cypress-io/cypress/issues/4346
    return it("can complete if a circular reference is sent", function() {
      const foo = {
        bar: {}
      };

      foo.bar.baz = foo;

      return Cypress.backend("foo", foo)
      .then(function() {
        throw new Error("should not reach");}).catch(e => expect(e.message).to.eq("You requested a backend event we cannot handle: foo"));
    });
  });

  context(".isCy", function() {
    it("returns true on cy, cy chainable", function() {
      let chainer;
      expect(Cypress.isCy(cy)).to.be.true;
      return chainer = cy.wrap().then(() => expect(Cypress.isCy(chainer)).to.be.true);
    });

    return it("returns false on non-cy objects", function() {
      expect(Cypress.isCy(undefined)).to.be.false;
      return expect(Cypress.isCy(() => ({}))).to.be.false;
    });
  });

  return context(".Log", function() {
    it("throws when using Cypress.Log.command()", function() {
      const fn = () => Cypress.Log.command({});

      return expect(fn).to.throw('has been renamed to `Cypress.log()`');
    });

    it("throws when passing non-object to Cypress.log()", function() {
      const fn = () => Cypress.log('My Log');

      expect(fn).to.throw().with.property("message")
        .and.include("`Cypress.log()` can only be called with an options object. Your argument was: `My Log`");
      return expect(fn).to.throw().with.property("docsUrl")
        .and.eq("https://on.cypress.io/cypress-log");
    });

    return it("does not throw when Cypress.log() called outside of command", function() {
      const fn = () => Cypress.log({ message: 'My Log' });

      return expect(fn).to.not.throw();
    });
  });
});
