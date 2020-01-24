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
    'Edge Canary',
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
    cy.render(render, <div>
      {_.map(browsers, (browser) => (
        <BrowserIcon browserName={browser} key={browser} />
      ))}
    </div>)

    _.each(browsers, (browser, i) => {
      cy.get('.browser-icon').eq(i)
      .should('have.attr', 'src')
      .and('include', _.kebabCase(browser))
    })
  })

  it('displays generic logo for unsupported browsers', () => {
    cy.render(render, <BrowserIcon browserName='custom' />)
    cy.get('.browser-icon').should('have.class', 'fa-globe')
  })
})
