/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe("without fetch polyfill", () => it("does not set polyfilled state", () => cy.visit("http://localhost:1818/first")
  .then(() => expect(cy.state("fetchPolyfilled")).to.be.undefined)));
