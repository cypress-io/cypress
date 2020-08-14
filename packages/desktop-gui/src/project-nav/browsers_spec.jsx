import React from 'react'
import Browsers from './browsers'
import { mount } from 'cypress-react-unit-test'
import browsers from '../../cypress/fixtures/browsers.json'

/* global cy */
describe('Browsers', () => {
  const mnt = (props) => {
    const BrowserNav = () =>
      (<nav className="project-nav navbar navbar-default">
        <div className="spacer" />
        <Browsers {...props} />
      </nav>)

    mount(<BrowserNav />, {
      stylesheets: '/__root/dist/app.css',
    })
  }

  const browserListClosed = () => {
    cy.get('.browser-icon:visible').should('have.length', 1)
  }

  const browserListOpened = () => {
    cy.get('.browser-icon:visible').should('have.length', 3)
  }

  it('renders list', () => {
    const project = {
      browsers,
      chosenBrowser: browsers[0],
      otherBrowsers: browsers.slice(1),
    }

    mnt({ project })

    // only single browser icon visible at the start
    cy.get('.browser-icon').should('have.length', 3)
    browserListClosed()

    // now all the browser icons should be visible
    cy.get('.dropdown-chosen').click()
    browserListOpened()

    cy.log('**closing**')
    cy.get('.spacer').click()
  })

  it('picks the browser', () => {
    const project = {
      browsers,
      chosenBrowser: browsers[0],
      otherBrowsers: browsers.slice(1),
      setChosenBrowser: cy.stub().as('setChosenBrowser'),
    }

    mnt({ project })

    // now all the browser icons should be visible
    cy.get('.dropdown-chosen').click()
    cy.contains('li', 'Canary 48').click()

    cy.log('**Canary was picked**')
    cy.get('@setChosenBrowser').should('have.been.calledWith', browsers[2])
    browserListClosed()
  })
})
