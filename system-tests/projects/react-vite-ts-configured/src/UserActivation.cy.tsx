import React from 'react'
import { mount } from 'cypress/react'

// https://github.com/cypress-io/cypress/issues/34993
it('runs components in a page with user activation', () => {
  mount(<button>Save</button>)

  cy.window().then((win) => {
    expect(win.navigator.userActivation.hasBeenActive, 'navigator.userActivation.hasBeenActive').to.be.true
  })
})
