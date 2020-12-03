/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe("No Running Test", function() {
  it("foo", () => cy.noop());

  it("bar", function() {});

  return context("nested suite", function() {
    cy.viewport("iphone-6");
    return cy.get("h1");
  });
});
