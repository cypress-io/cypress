/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe("issue 674",  function() {
  beforeEach(function() {
    throw new Error();
  });

  afterEach(function() {
    throw new Error();
  });

  return it("doesn't hang when both beforeEach and afterEach fail",  function() {});
});
