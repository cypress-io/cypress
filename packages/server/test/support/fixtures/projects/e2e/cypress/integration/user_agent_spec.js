/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe("user agent", function() {
  it("is set on visits", function() {
    cy.visit("/agent");
    return cy.get("#agent").should("contain", "foo bar baz agent");
  });

  return it("is set on requests", () => cy
    .request("PUT", "/agent")
    .its("body").should("deep.eq", {
      userAgent: "foo bar baz agent"
    }));
});
