/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe("react v16.0.0", () => context("fires onChange events", function() {
  beforeEach(() => cy.visit("/fixtures/react-16.html"));

  it("input", () => cy
    .get("#react-container input[type=text]").type("foo").blur()
    .window().its("onChangeEvents").should("eq", 3));

  it("email", () => cy
    .get("#react-container input[type=email]").type("foo").blur()
    .window().its("onChangeEvents").should("eq", 3));

  return it("number", () => cy
    .get("#react-container input[type=number]").type("123").blur()
    .window().its("onChangeEvents").should("eq", 3));
}));
