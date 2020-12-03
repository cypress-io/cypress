/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe("async", function() {
  it("bar fails", function(done) {
    this.timeout(100);

    cy.on("fail", function() {});

    //# async caught fail
    return foo.bar();
  });

  return it("fails async after cypress command", function(done) {
    this.timeout(100);

    return cy.wait(0);
  });
});
