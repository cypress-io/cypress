/* eslint-env mocha */
import unfetch from 'unfetch'
require('@cypress/code-coverage/support')

/** Initialize an empty document with root element */
function renderTestingPlatform() {
  const document = cy.state('document')
  const el = document.getElementById('cypress-jsdom')
  if (el) {
    // clean the element before each test
    while (el.hasChildNodes()) {
      el.removeChild(el.lastChild)
    }
    return
  }

  const rootNode = document.createElement('div')
  rootNode.setAttribute('id', 'cypress-jsdom')
  document.getElementsByTagName('body')[0].prepend(rootNode)

  return cy.get('#cypress-jsdom', { log: false })
}

/**
 * Replaces window.fetch with a polyfill based on XMLHttpRequest
 * that Cypress can spy on and stub
 * @see https://www.cypress.io/blog/2020/06/29/experimental-fetch-polyfill/
 */
function polyfillFetchIfNeeded() {
  // @ts-ignore
  if (Cypress.config('experimentalFetchPolyfill')) {
    // @ts-ignore
    if (!cy.state('fetchPolyfilled')) {
      delete window.fetch
      window.fetch = unfetch
      // @ts-ignore
      cy.state('fetchPolyfilled', true)
    }
  }
}

beforeEach(() => {
  renderTestingPlatform()
  polyfillFetchIfNeeded()
})
