import React from 'react'
import Browsers from './browsers'
import Project from '../project/project-model'
import { mount } from 'cypress-react-unit-test'
import browsers from '../../cypress/fixtures/browsers.json'

/* global cy */
describe('Browsers', () => {
  /**
   * Mounts the Browsers component surrounded
   * by the right markup for realistic styles
   */
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

  /**
   * Creates an instance of the full Project Model class
   */
  const mntProjectModel = () => {
    const project = new Project({})

    project.setBrowsers(browsers)

    mnt({ project })
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

  it('saves the selected browser', () => {
    mntProjectModel()
    cy.get('.dropdown-chosen').click()
    cy.contains('li', 'Canary 48').click()

    const expectedBrowser = { 'name': 'chrome', 'channel': 'canary' }

    cy.wrap(window.localStorage)
    .invoke('getItem', 'chosenBrowser').should('equal', JSON.stringify(expectedBrowser))
  })

  context('previously chosen browser', () => {
    it('picks the first browser if there is nothing saved', () => {
      window.localStorage.clear()
      mntProjectModel()
      cy.contains('li', 'Chrome 50').should('be.visible')
    })

    it('finds chrome browser by name and channel', () => {
      const savedBrowser = { 'name': 'chrome', 'channel': 'canary' }

      window.localStorage.setItem('chosenBrowser', JSON.stringify(savedBrowser))
      mntProjectModel()
      // we go to that browser
      cy.contains('li', 'Canary 48').should('be.visible')
    })

    it('picks stable browser if channel is missing', () => {
      const savedBrowser = { 'name': 'chrome' }

      window.localStorage.setItem('chosenBrowser', JSON.stringify(savedBrowser))
      mntProjectModel()
      // we go to stable channel
      cy.contains('li', 'Chrome 50').should('be.visible')
    })

    it('finds chrome browser by name (old way)', () => {
      // if an old version of Cypress saved the browser name only
      window.localStorage.setItem('chosenBrowser', 'chrome')
      mntProjectModel()
      // we go to that browser
      cy.contains('li', 'Chrome 50').should('be.visible')
    })

    it('finds chromium browser by name (old way)', () => {
      // if an old version of Cypress saved the browser name only
      window.localStorage.setItem('chosenBrowser', 'chromium')
      mntProjectModel()
      // we go to that browser
      cy.contains('li', 'Chromium 49').should('be.visible')
    })

    it('sets default browser if cannot find', () => {
      window.localStorage.setItem('chosenBrowser', 'no-no-no')
      mntProjectModel()
      cy.contains('li', 'Chrome 50').should('be.visible')
    })
  })
})
