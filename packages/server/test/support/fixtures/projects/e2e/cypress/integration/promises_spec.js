/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
it("catches regular promise errors", () => Promise.reject(new Error("bar")));

it("catches promise errors and calls done with err even when async", done => Promise.resolve(null)
.then(function() {
  throw new Error("foo");
}));
