export const testFail = (cb, expectedDocsUrl = 'https://on.cypress.io/intercept') => {
  cy.on('fail', (err) => {
    const docsUrl = Array.isArray(err.docsUrl) ? err.docsUrl[0] : err.docsUrl

    expect(docsUrl).to.eq(expectedDocsUrl)
    cb(err)
  })
}

// Due to an issue with requests leaking between tests, we need to ensure that routes are unique from test to test
// See https://github.com/cypress-io/cypress/issues/20397
let routeCount = 0

export const uniqueRoute = (route) => {
  routeCount += 1

  return `${route}-${routeCount}`
}

// The default network path intercepts in the browser through CDP, which only
// Chromium-family browsers support; Firefox, Electron, and WebKit stay on the
// HTTP/1 proxy either way.
export const usesBrowserNetworkPath = !Cypress.config('forceHttp1') && Cypress.isBrowser([{ name: '!electron', family: 'chromium' }])
