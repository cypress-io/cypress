/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
it("can inject text from an extension", () => cy
  .visit("/index.html")
  .get("#extension").should("contain", "inserted from extension!"));
