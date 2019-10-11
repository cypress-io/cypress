/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const $ = Cypress.$.bind(Cypress);

describe("src/dom/elements", function() {
  context(".isAttached", function() {
    beforeEach(() => cy.visit("/fixtures/iframe-outer.html"));

    it("no elements", function() {
      const $el = $(null);

      return expect(Cypress.dom.isAttached($el)).to.be.false;
    });

    it("element", () =>
      cy.get("span").then(function($span) {
        expect(Cypress.dom.isAttached($span)).to.be.true;

        $span.remove();

        return expect(Cypress.dom.isAttached($span)).to.be.false;
      })
    );

    it("stale element", done =>
      cy.get("span").then(function($span) {
        expect(Cypress.dom.isAttached($span)).to.be.true;

        cy.on("window:load", function() {
          expect(Cypress.dom.isAttached($span)).to.be.false;
          return done();
        });

        return cy.window().then(win => win.location.reload());
      })
    );

    it("window", () =>
      cy.window().then(win =>
        //# windows are always considered attached since
        //# their references will be replaced anyway with
        //# new windows
        expect(Cypress.dom.isAttached(win)).to.be.true
      )
    );

    it("document", done =>
      cy.document().then(function(doc) {
        //# documents are considered attached only if
        //# they have a defaultView (window) which will
        //# be null when the documents are stale
        expect(Cypress.dom.isAttached(doc)).to.be.true;

        cy.on("window:load", function() {
          expect(Cypress.dom.isAttached(doc)).to.be.false;
          return done();
        });

        return cy.window().then(win => win.location.reload());
      })
    );

    return it("element in iframe", done =>
      cy.get("iframe").then(function($iframe) {
        const $doc = $iframe.contents();

        const $btn = $doc.find("button");

        expect($btn.length).to.eq(1);

        expect(Cypress.dom.isAttached($btn)).to.be.true;

        //# when the iframe is reloaded
        $iframe.on("load", function() {
          //# the element should be stale now
          expect(Cypress.dom.isAttached($btn)).to.be.false;
          return done();
        });

        const win = $doc.get(0).defaultView;

        return win.location.reload();
      })
    );
  });

  context(".isDetached", () =>
    it("opposite of attached", function() {
      const $el = $(null);

      return expect(Cypress.dom.isDetached($el)).to.be.true;
    })
  );

  return context(".isType", function() {
    beforeEach(() => cy.visit("/fixtures/dom.html"));

    it("when type is a string", function() {
      const $el = $('input[type="number"]');

      expect(Cypress.dom.isType($el, 'number')).to.be.true;
      return expect(Cypress.dom.isType($el, 'text')).to.be.false;
    });

    return it("when type is an array", function() {
      const $el = $('input[type="number"]');

      expect(Cypress.dom.isType($el, ['number', 'text', 'email'])).to.be.true;
      return expect(Cypress.dom.isType($el, ['text', 'email'])).to.be.false;
    });
  });
});
