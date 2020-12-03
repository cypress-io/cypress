/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe("base url", () => it("can visit", () => cy
  .visit("/html")
  .contains("Herman Melville")));
