/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe("foo", function() {
  it("baz fails", () => //# synchronous caught fail
  foo.bar());

  it("bar fails", done => //# async caught fail
  foo.bar());

  it("quux fails", done => //# commands caught never calling done
  //# with no fail handler should immediately die
  cy.wrap(null).then(() => foo.bar()));

  it("quux2 fails", function(done) {
    cy.on("fail", () => foo.bar());

    //# commands caught never calling done
    //# but have a failing handler should die
    return cy.wrap(null).then(() => foo.bar());
  });

  it("quux3 passes", function(done) {
    cy.on("fail", () => done());

    //# commands caught with a fail handler
    //# and call done should pass
    return cy.wrap(null).then(() => foo.bar());
  });

  it("quux4 passes", function() {
    cy.on("fail", function() {});

    //# commands caught with a fail handler
    //# and no done callback will pass if
    //# nothing throws in the fail callback
    return cy.wrap(null).then(() => foo.bar());
  });

  it("quux5 passes", function() {
    cy.on("fail", function() {});

    //# no commands fail handler should pass
    return foo.bar();
  });

  return it("quux6 passes", function(done) {
    cy.on("fail", () => done());

    //# no commands fail async handler should pass
    return foo.bar();
  });
});
