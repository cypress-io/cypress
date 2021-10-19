/* eslint-disable
    mocha/no-global-tests,
    no-undef,
*/
const { devicePixelRatio } = window

it('takes consistent viewport captures', () => {
  const options = { capture: 'viewport', blackout: ['.black-me-out'] }

  cy.visit('http://localhost:3322/viewport')
  cy.screenshot('viewport-original', options)
  .then(() => {
    // take 25 screenshots and check that they're all the same
    // to ensure the Cypress UI is consistently hidden
    const fn = function () {
      cy.screenshot('viewport-compare', options)

      cy.task('compare:screenshots', {
        a: 'screenshot_viewport_capture_spec.js/viewport-original',
        b: 'screenshot_viewport_capture_spec.js/viewport-compare',
        blackout: true,
        devicePixelRatio,
      })
    }

    Cypress._.times(25, fn)
  })
})
