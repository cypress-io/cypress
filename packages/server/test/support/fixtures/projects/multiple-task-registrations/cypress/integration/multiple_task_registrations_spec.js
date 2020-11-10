/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
it("merges task events", function() {
  cy.task("one").should("equal", "one");
  cy.task("two").should("equal", "two again");
  return cy.task("three").should("equal", "three");
});
