/* eslint-disable
    mocha/no-global-tests,
    no-undef,
*/
const { devicePixelRatio } = window

it('takes consistent fullPage captures', () => {
  const options = { capture: 'fullPage', blackout: ['.black-me-out'] }

  cy.viewport(600, 200)
  cy.visit('http://localhost:3322/fullPage')
  cy.screenshot('fullPage-original', options)
  .then(() => {
    // take 10 screenshots and check that they're all the same
    // to ensure fullPage screenshots are consistent
    const fn = function (index) {
      cy.screenshot('fullPage-compare', options)

      cy.task('compare:screenshots', {
        a: 'screenshot_fullpage_capture_spec.js/fullPage-original',
        b: 'screenshot_fullpage_capture_spec.js/fullPage-compare',
        blackout: true,
        devicePixelRatio,
      })
    }

    Cypress._.times(10, fn)
  })
})
