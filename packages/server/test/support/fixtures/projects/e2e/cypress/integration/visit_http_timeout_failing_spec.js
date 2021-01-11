/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe("when visit times out", function() {
  it("fails timeout exceeds pageLoadTimeout", () => cy.visit("http://localhost:3434/timeout?ms=3000"));

  return it("fails timeout exceeds timeout option", () => cy.visit("http://localhost:3434/timeout?ms=8888", {timeout: 500}));
});
