/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let onBeforeLoad;
let onLoad = (onBeforeLoad = null);

Cypress.Commands.overwrite("visit", function(originalVisit, url, options) {
  onBeforeLoad = cy.stub().as('onBeforeLoad');
  onLoad = cy.stub().as('onLoad');

  return originalVisit(url, { onBeforeLoad, onLoad });
});

context("issue #2196: overwriting visit", () => it("fires onBeforeLoad", () => cy
  .visit("http://localhost:3434/index.html")
  .then(function() {
    expect(onBeforeLoad).to.be.called;
    return expect(onLoad).to.be.called;
})));
