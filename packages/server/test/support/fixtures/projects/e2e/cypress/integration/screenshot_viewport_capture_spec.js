/* eslint-disable
    mocha/no-global-tests,
    no-undef,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const { devicePixelRatio } = window

it('takes consistent viewport captures', () => {
  const options = { capture: 'viewport', blackout: ['.black-me-out'] }

  return cy
  .visit('http://localhost:3322/viewport')
  .screenshot('viewport-original', options)
  .then(() => {
    // take 25 screenshots and check that they're all the same
    // to ensure the Cypress UI is consistently hidden
    const fn = function () {
      cy.screenshot('viewport-compare', options)

      return cy.task('compare:screenshots', {
        a: 'screenshot_viewport_capture_spec.coffee/viewport-original',
        b: 'screenshot_viewport_capture_spec.coffee/viewport-compare',
        blackout: true,
        devicePixelRatio,
      })
    }

    Cypress._.times(25, fn)
  })
})
