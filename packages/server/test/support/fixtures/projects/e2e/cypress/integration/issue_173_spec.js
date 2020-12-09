/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
beforeEach(() => cy.visit("/index.html"));

it("fails", () => cy.get("element_does_not_exist", {timeout: 200}));

it("should be able to log", () => cy.get("body").should("contain", "hi"));