/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe("failures", function() {
  it("failure1", function() {
    throw new Error("foo");
  });

  return it("failure2", function() {
    throw new Error("bar");
  });
});