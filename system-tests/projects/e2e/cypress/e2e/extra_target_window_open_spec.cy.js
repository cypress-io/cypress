/* eslint-disable no-undef */

// Each test opens a popup window via window.open. In Chrome and Electron the
// popup is exposed as an extra browser "target" that Cypress attaches to in a
// paused state (waitForDebuggerOnStart). Opening one per test exercises
// attaching to - and tearing down - extra targets across the between-test
// transition, which is where the runner could previously hang.
// Regression guard for https://github.com/cypress-io/cypress/issues/32956
describe('window.open extra targets', () => {
  const openPopup = () => {
    cy.visit('http://localhost:1920/opener')
    cy.get('h1').should('contain', 'opener')

    cy.window().then((win) => {
      // open an extra target and intentionally leave it open so that the
      // between-test reset has to manage/close it
      win.open('http://localhost:1920/popup', '_blank')
    })

    // give the new target time to attach and be managed before the test ends
    cy.wait(250)
  }

  it('opens a popup in test 1', openPopup)

  it('opens a popup in test 2', openPopup)

  it('opens a popup in test 3', openPopup)
})
