/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
it("nests the file based on spec path", function() {
  cy.screenshot({ capture: "runner" });
  return cy.readFile("cypress/screenshots/nested-1/nested-2/screenshot_nested_file_spec.coffee/nests the file based on spec path.png", 'base64');
});
