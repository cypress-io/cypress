/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//# this should run
it("t1b", function() {});

//# these 3 should be skipped
describe("s1b", function() {
  beforeEach(() => cy.visit("/visit_error.html"));

  it("t2b", function() {});
  it("t3b", function() {});
  return it("t4b", function() {});
});

//# these 3 should run because we override mocha's
//# default handling of uncaught errors
describe("s2b", function() {
  it("t5b", function() {});
  it("t6b", function() {});
  return it("t7b", function() {});
});
