/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
Cypress._.times(3, () => {
  return it("cy.screenshot() - replacement", () => cy.screenshot("replace-me", { capture: "runner" }, {
    onAfterScreenshot(details) {
      expect(details.path).to.include("screenshot-replacement.png");
      expect(details.size).to.equal(1047);
      return expect(details.dimensions).to.eql({ width: 1, height: 1 });
    }
  }));
});
