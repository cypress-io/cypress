/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//# https://github.com/cypress-io/cypress/issues/565
describe("issue 565", function() {
  before(() => cy
    .viewport(400, 400)
    .visit("/fixtures/issue-565.html"));

  return it("can click the first tr", () => cy.get("td:first").click());
});
