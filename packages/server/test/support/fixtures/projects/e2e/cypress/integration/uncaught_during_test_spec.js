/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe("foo", function() {
  it("fails with setTimeout", function() {
    setTimeout(() => foo.bar()
    , 10);

    return cy.wait(1000);
  });

  it("fails with setTimeout and done", done => setTimeout(() => foo.bar()));

  it("passes with fail handler after failing with setTimeout", function(done) {
    cy.on("fail", function(err) {
      expect(err.message).to.include("foo is not defined");

      setTimeout(() => done());

      return false;
    });

    return setTimeout(() => foo.bar());
  });

  it("fails with async app code error", function() {
    cy.visit("/js_errors.html");
    cy.get(".async-error").click();
    return cy.wait(10000);
  });

  it("passes with fail handler after failing with async app code error", function(done) {
    cy.on("fail", function(err) {
      expect(err.message).to.include("qax is not defined");
      expect(err.stack).to.include("qax is not defined");

      setTimeout(() => done());

      return false;
    });

    cy.visit("/js_errors.html");
    cy.get(".async-error").click();
    return cy.wait(10000);
  });

  //# FIXME: Currently times out but doesn't display the error
  return it.skip("fails with promise", function() {
    setTimeout(() => foo.bar());

    return new Promise(function() {});
  });
});
