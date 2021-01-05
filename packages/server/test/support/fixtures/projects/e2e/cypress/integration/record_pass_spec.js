/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe("record pass", function() {
  it("passes", function() {
    cy.visit("/scrollable.html");
    return cy
      .viewport(400, 400)
      .get("#box")
      .screenshot('yay it passes');
  });

  return it("is pending");
});
