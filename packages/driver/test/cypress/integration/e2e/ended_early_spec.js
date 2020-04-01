/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe("ended early", () => it("can end early without problems", done => cy
  .wrap(null)
  .then(() => done()).then(function() {
    throw new Error("foo");
})));
