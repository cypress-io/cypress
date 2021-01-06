/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe("simple failing spec", function() {
  it("fails1", () => cy.wrap(true, {timeout: 100}).should("be.false"));

  return it("fails2", function() {
    throw new Error("fails2");
  });
});