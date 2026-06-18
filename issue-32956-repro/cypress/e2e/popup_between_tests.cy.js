/* eslint-disable no-undef */

// Reproduction for https://github.com/cypress-io/cypress/issues/32956
//
// Each test opens a popup via window.open. In Chrome and Electron the popup is
// an extra browser "target" that Cypress attaches to in a paused state
// (waitForDebuggerOnStart). The runner only resumes that target after it has
// connected to it over CDP. If that connection ever hangs, the target is left
// paused forever and the run hangs in the transition between tests - with no
// error and no timeout.
//
// The hang is a race in the wild, so several tests are included to give it more
// chances to occur. To reproduce DETERMINISTICALLY, see README.md (it forces
// the extra-target connection to hang).
const openPopup = () => {
  cy.visit('http://localhost:9988/opener')
  cy.get('h1').should('contain', 'opener')

  cy.window().then((win) => {
    // open an extra target and leave it open so the between-test reset has to
    // attach to / tear down the extra target
    win.open('http://localhost:9988/popup', '_blank')
  })

  // give the new target time to attach before the test ends
  cy.wait(250)
}

describe('window.open hang between tests (#32956)', () => {
  for (let i = 1; i <= 10; i++) {
    it(`opens a popup - test ${i}`, openPopup)
  }
})
