/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe("record fails", function() {
  beforeEach(function() {
    throw new Error("foo");
  });

  it("fails 1", function() {});

  return it("is skipped", function() {});
});
