/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe("stdout_passing_spec", function() {
  context("file", () => it("visits file", () => cy.visit("/index.html")));

  context("google", function() {
    it("visits google", () => cy.visit("https://www.google.com"));

    return it("google2", function() {});
  });

  context("apple", function() {
    it("apple1", function() {});

    return it("visits apple", () => cy.visit("https://www.apple.com"));
  });

  return context("subdomains", function() {
    it("cypress1", function() {});

    it("visits cypress", () => cy
      .visit("https://www.cypress.io")
      .visit("https://docs.cypress.io"));

    return it("cypress3", function() {});
  });
});