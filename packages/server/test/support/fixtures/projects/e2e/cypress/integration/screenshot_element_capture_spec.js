/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const { devicePixelRatio } = window;

it("takes consistent element captures", () => cy
  .viewport(600, 200)
  .visit("http://localhost:3322/element")
  .get(".capture-me")
  .screenshot("element-original")
  .then(function() {
    //# take 10 screenshots and check that they're all the same
    //# to ensure element screenshots are consistent
    const fn = function(index) {
      cy.get(".capture-me").screenshot("element-compare");
      return cy.task("compare:screenshots", { 
        a: "screenshot_element_capture_spec.coffee/element-original",
        b: "screenshot_element_capture_spec.coffee/element-compare", devicePixelRatio 
      });
    };

    Cypress._.times(10, fn);

}));
