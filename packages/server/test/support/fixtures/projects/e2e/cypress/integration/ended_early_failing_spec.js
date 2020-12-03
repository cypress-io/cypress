/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe("ending early",  function() {
  it("does not end early", function() {});

  return it("does end early", function(done) {
    cy
      .noop({})
      .then(() => Cypress.Promise.delay(1000)).noop({})
      .wrap({});

    return setTimeout(() => done()
    , 500);
  });
});