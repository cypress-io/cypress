import React from 'react'
import Browsers from './browsers'
import { mount } from 'cypress-react-unit-test'
import browsers from '../../cypress/fixtures/browsers.json'

/* global cy */
describe('Browsers', () => {
  it('renders list', () => {
    const project = {
      browsers,
      chosenBrowser: browsers[0],
      otherBrowsers: browsers.slice(1),
    }

    mount(<Browsers project={project} />, {
      stylesheets: '/__root/dist/app.css',
    })

    // only single browser icon visible at the start
    cy.get('.browser-icon').should('have.length', 3)
    cy.get('.browser-icon:visible').should('have.length', 1)

    // now all the browser icons should be visible
    cy.get('.dropdown-chosen').click()
    cy.get('.browser-icon:visible').should('have.length', 3)
  })
})
