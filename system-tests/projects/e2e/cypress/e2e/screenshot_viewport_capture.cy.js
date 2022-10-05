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
        a: 'screenshot_viewport_capture.cy.js/viewport-original',
        b: 'screenshot_viewport_capture.cy.js/viewport-compare',
        blackout: true,
        devicePixelRatio,
      })
    }

    Cypress._.times(25, fn)
  })
})

// @see https://github.com/cypress-io/cypress/issues/22173
it('properly blacks out absolute elements within a relative container', () => {
  cy.visit('cypress/fixtures/screenshot-blackout.html')
  .get('.centered-container')
  .screenshot({
    blackout: ['.blue'],
    onBeforeScreenshot () {
      const blackedOutElementCoordinates = Cypress.$(
        '#__cypress-animation-disabler+div.__cypress-blackout',
      )[0].getBoundingClientRect()

      const actualElementCoordinates = Cypress.$(
        '.centered-container .blue',
      )[0].getBoundingClientRect()

      // make sure blackout element is within 1 pixel of it's element it is supposed to black out
      expect(blackedOutElementCoordinates.bottom).to.be.closeTo(
        actualElementCoordinates.bottom,
        1,
      )

      expect(blackedOutElementCoordinates.height).to.be.closeTo(
        actualElementCoordinates.height,
        1,
      )

      expect(blackedOutElementCoordinates.left).to.be.closeTo(
        actualElementCoordinates.left,
        1,
      )

      expect(blackedOutElementCoordinates.right).to.be.closeTo(
        actualElementCoordinates.right,
        1,
      )

      expect(blackedOutElementCoordinates.top).to.be.closeTo(
        actualElementCoordinates.top,
        1,
      )

      expect(blackedOutElementCoordinates.width).to.be.closeTo(
        actualElementCoordinates.width,
        1,
      )

      expect(blackedOutElementCoordinates.x).to.be.closeTo(
        actualElementCoordinates.x,
        1,
      )

      expect(blackedOutElementCoordinates.y).to.be.closeTo(
        actualElementCoordinates.y,
        1,
      )
    },
  })
})
