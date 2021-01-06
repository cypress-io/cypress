/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const { devicePixelRatio } = window;

it("takes consistent fullPage captures", function() {
  const options = { capture: "fullPage", blackout: [".black-me-out"] };

  return cy
    .viewport(600, 200)
    .visit("http://localhost:3322/fullPage")
    .screenshot("fullPage-original", options)
    .then(function() {
      //# take 10 screenshots and check that they're all the same
      //# to ensure fullPage screenshots are consistent
      const fn = function(index) {
        cy.screenshot("fullPage-compare", options);
        return cy.task("compare:screenshots", { 
          a: "screenshot_fullpage_capture_spec.coffee/fullPage-original", 
          b: "screenshot_fullpage_capture_spec.coffee/fullPage-compare", 
          blackout: true,
          devicePixelRatio 
        });
      };

      Cypress._.times(10, fn);

  });
});
