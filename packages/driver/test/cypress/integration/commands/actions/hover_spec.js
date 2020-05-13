/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const $ = Cypress.$.bind(Cypress);
const {
  _
} = Cypress;

describe("src/cy/commands/actions/hover", function() {
  before(() => cy
    .visit("/fixtures/dom.html")
    .then(function(win) {
      return this.body = win.document.body.outerHTML;
  }));

  beforeEach(function() {
    const doc = cy.state("document");

    return $(doc.body).empty().html(this.body);
  });

  return context("#hover", () => it("throws when invoking", function(done) {
    cy.on("fail", function(err) {
      expect(err.message).to.include("`cy.hover()` is not currently implemented.");
      expect(err.docsUrl).to.eq("https://on.cypress.io/hover");
      return done();
    });

    return cy.get("button").hover();
  }));
});
