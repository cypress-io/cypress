/* eslint-disable
    mocha/no-global-tests,
    no-undef,
*/
const { devicePixelRatio } = window

it('takes consistent element captures', () => {
  cy.viewport(600, 200)
  cy.visit('http://localhost:3322/element')
  cy.get('.capture-me')
  .screenshot('element-original')
  .then(() => {
  // take 10 screenshots and check that they're all the same
  // to ensure element screenshots are consistent
    const fn = function () {
      cy.get('.capture-me').screenshot('element-compare')

      cy.task('compare:screenshots', {
        a: 'screenshot_element_capture_spec.js/element-original',
        b: 'screenshot_element_capture_spec.js/element-compare', devicePixelRatio,
      })
    }

    Cypress._.times(10, fn)
  })
})
