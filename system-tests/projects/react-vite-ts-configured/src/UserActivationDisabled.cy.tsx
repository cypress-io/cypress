import React from 'react'
import { mount } from 'cypress/react'

// The page loads before the suite's config applies, so this checks that turning the
// option off for the outermost suite still applies to it.
// https://github.com/cypress-io/cypress/issues/34993
describe('user activation turned off for the spec', { userActivation: false }, () => {
  it('leaves the component page unactivated', () => {
    mount(<button>Save</button>)

    cy.window().then((win) => {
      expect(win.navigator.userActivation.hasBeenActive, 'navigator.userActivation.hasBeenActive').to.be.false
    })
  })

  it('activates the component page for a test that turns it back on', { userActivation: true }, () => {
    mount(<button>Save</button>)

    cy.window().then((win) => {
      expect(win.navigator.userActivation.hasBeenActive, 'navigator.userActivation.hasBeenActive').to.be.true
    })
  })
})
