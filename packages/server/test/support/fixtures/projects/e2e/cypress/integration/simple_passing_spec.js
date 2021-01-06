/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe("simple passing spec", function() {
  beforeEach(() => cy.wait(1000));

  return it("passes", () => cy.wrap(true).should("be.true"));
});
