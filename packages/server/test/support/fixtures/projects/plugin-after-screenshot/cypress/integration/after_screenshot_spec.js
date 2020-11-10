/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
it("cy.screenshot() - replacement", () => cy.screenshot("replace-me", { capture: "runner" }, {
  onAfterScreenshot(details) {
    expect(details.path).to.include("screenshot-replacement.png");
    expect(details.size).to.equal(1047);
    return expect(details.dimensions).to.eql({ width: 1, height: 1 });
  }
}));

it("cy.screenshot() - ignored values", () => cy.screenshot("ignored-values", { capture: "runner" }, {
  onAfterScreenshot(details) {
    expect(details.path).to.include("ignored-values.png");
    expect(details.multipart).to.be.false;
    return expect(details.name).to.equal("ignored-values");
  }
}));

it("cy.screenshot() - invalid return", () => cy.screenshot("invalid-return", { capture: "runner" }, {
  onAfterScreenshot(details) {
    return expect(details.path).to.include("invalid-return.png");
  }
}));

it("failure screenshot - rename", function() {
  throw new Error("test error");
});
