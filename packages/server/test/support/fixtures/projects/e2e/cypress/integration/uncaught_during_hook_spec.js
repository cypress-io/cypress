/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let testAfterRunEvent = false;

Cypress.on("test:after:run", function(obj) {
  if (obj.title === "does not run") {
    return testAfterRunEvent = true;
  }
});

describe("foo", function() {
  before(function() {
    setTimeout(() => foo.bar()
    , 10);

    return cy.wait(1000);
  });

  return it("does not run", function() {});
});

describe("bar", () => it("runs", () => expect(testAfterRunEvent).to.be.true));
