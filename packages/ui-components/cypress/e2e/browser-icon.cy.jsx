import { render } from 'react-dom'
import React from 'react'
import { BrowserIcon } from '../../src'

describe('<BrowserIcon />', () => {
  const _ = Cypress._

  const browsers = [
    'Canary',
    'Chrome',
    'Chromium',
    'Edge',
    'Edge Beta',
    'Edge Canary',
    'Edge Dev',
    'Electron',
    'Firefox',
    'Firefox Developer Edition',
    'Firefox Nightly',
  ]

  beforeEach(() => {
    cy.visit('dist/index.html')
    cy.viewport(200, 200)
  })

  it('displays correct logo for supported browsers', () => {
    cy.render(render, <>
      {_.map(browsers, (browser) => (
        <BrowserIcon browserName={browser} key={browser} />
      ))}
    </>)

    _.each(browsers, (browser, i) => {
      cy.get('.browser-icon').eq(i)
      .should('have.attr', 'src')
      .and('include', _.kebabCase(browser))
    })
  })

  it('displays family logo for other variants', () => {
    cy.render(render, <>
      <BrowserIcon browserName='Chrome Custom' />
      <BrowserIcon browserName='Edge Custom' />
      <BrowserIcon browserName='Electron Custom' />
      <BrowserIcon browserName='Firefox Custom' />
      <BrowserIcon browserName='Chromium Custom' />
    </>)

    cy.get('.browser-icon').eq(0)
    .should('have.attr', 'src')
    .and('include', 'chrome')

    cy.get('.browser-icon').eq(1)
    .should('have.attr', 'src')
    .and('include', 'edge')

    cy.get('.browser-icon').eq(2)
    .should('have.attr', 'src')
    .and('include', 'electron')

    cy.get('.browser-icon').eq(3)
    .should('have.attr', 'src')
    .and('include', 'firefox')

    cy.get('.browser-icon').eq(4)
    .should('have.attr', 'src')
    .and('include', 'chromium')
  })

  it('displays generic logo for unsupported browsers', () => {
    cy.render(render, <BrowserIcon browserName='custom' />)
    cy.get('.browser-icon').should('have.class', 'fa-globe')
  })
})
