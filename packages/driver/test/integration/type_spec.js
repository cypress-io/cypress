/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe("Type Integration Tests", () => context("type", function() {
  enterCommandTestingMode("type");

  return describe("card.js", () => it("it correctly changes the caret position and value of card expiration", function() {
    return this.cy
      .window().then(win => win.$("form").card({
      container: "#card-container"
    })).get("[name='expiry']")
        .type("0314")
        .should("have.value", "03 / 14");
  }));
}));
