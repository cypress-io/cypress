// @ts-ignore
const unfetch = require('unfetch/dist/unfetch.js')
// @ts-ignore
const isComponentSpec = () => Cypress.spec.specType === 'component'

// When running component specs, we cannot allow "cy.visit"
// because it will wipe out our preparation work, and does not make much sense
// thus we overwrite "cy.visit" to throw an error
Cypress.Commands.overwrite('visit', (visit, ...args: any[]) => {
  if (isComponentSpec()) {
    throw new Error(
      'cy.visit from a component spec is not allowed\n' +
        'see https://github.com/bahmutov/cypress-react-unit-test/issues/286',
    )
  } else {
    // allow regular visit to proceed
    return visit(...args)
  }
})

/** Initialize an empty document with root element */
function renderTestingPlatform() {
  // Let's mount components under a new div with this id
  const rootId = 'cypress-root'

  const document = cy.state('document') as Document
  if (document.getElementById(rootId)) {
    return
  }

  const rootNode = document.createElement('div')
  rootNode.setAttribute('id', rootId)
  document.getElementsByTagName('body')[0].prepend(rootNode)

  const selector = '#' + rootId
  return cy.get(selector, { log: false })
}

/**
 * Replaces window.fetch with a polyfill based on XMLHttpRequest
 * that Cypress can spy on and stub
 * @see https://www.cypress.io/blog/2020/06/29/experimental-fetch-polyfill/
 */
function polyfillFetchIfNeeded() {
  // @ts-ignore
  if (Cypress.config('experimentalFetchPolyfill')) {
    if (!cy.state('fetchPolyfilled')) {
      delete window.fetch
      window.fetch = unfetch
      // @ts-ignore
      cy.state('fetchPolyfilled', true)
    }
  }
}

before(() => {
  if (!isComponentSpec()) {
    return
  }

  polyfillFetchIfNeeded()
  renderTestingPlatform()
})

/**
 * Remove any style or extra link elements from the iframe placeholder
 * left from any previous test
 *
 */
function cleanupStyles() {
  if (!isComponentSpec()) {
    return
  }
  const document = cy.state('document') as Document

  const styles = document.body.querySelectorAll('style')
  styles.forEach(styleElement => {
    if (styleElement.parentElement) {
      styleElement.parentElement.removeChild(styleElement)
    }
  })

  const links = document.body.querySelectorAll('link[rel=stylesheet]')
  links.forEach(link => {
    if (link.parentElement) {
      link.parentElement.removeChild(link)
    }
  })
}

beforeEach(cleanupStyles)
