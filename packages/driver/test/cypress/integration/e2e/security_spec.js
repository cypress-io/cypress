/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe("security", () => it("works by replacing obstructive code", function() {
  cy.visit("/fixtures/security.html");
  return cy.get("div").should("not.exist");
}));
