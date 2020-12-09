/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe("form submission fails", function() {
  beforeEach(() => cy.visit("/forms.html"));

  return it("fails without an explicit wait when an element is immediately found", () => cy
    .server()
    .route("POST", "/users", {})
    .get("input[name=name]").type("brian")
    .get("#submit").click()
    .get("form").then($form => expect($form).to.contain("form success!")));
});
