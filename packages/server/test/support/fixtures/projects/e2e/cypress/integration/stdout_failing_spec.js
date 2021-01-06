/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe("stdout_failing_spec", function() {
  it("passes", function() {});

  it("fails", () => cy.then(function() {
    throw new Error("foo");
  }));

  it("doesnt fail", function() {});

  context("failing hook", function() {
    beforeEach(() => cy.visit("/does-not-exist.html"));

    return it("is failing", function() {});
  });

  return context("passing hook", function() {
    beforeEach(() => cy.wrap({}));

    return it("is failing", () => cy.visit("/does-not-exist.html"));
  });
});