/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
it("throws when task returns undefined", () => cy.task("returns:undefined"));

it("includes stack trace in error", () => cy.task("errors", "Error thrown in task handler"));
