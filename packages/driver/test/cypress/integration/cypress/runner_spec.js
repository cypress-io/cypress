/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const pending = [];

Cypress.on("test:after:run", function(test) {
  if (test.state === "pending") {
    return pending.push(test);
  }
});

describe("src/cypress/runner", function() {
  it('handles "double quotes" in test name', function(done) {
    cy.once("log:added", function(log) {
      expect(log.hookName).to.equal("test");
      return done();
    });
    return cy.wrap({});
  });

  return context("pending tests", function() {
    it("is not pending", function() {});

    it("is pending 1");

    it("is pending 2");

    return it("has 2 pending tests", function() {
      expect(pending).to.have.length(2);

      expect(pending[0].title).to.eq("is pending 1");
      return expect(pending[1].title).to.eq("is pending 2");
    });
  });
});
