const systemTests = require('../lib/system-tests').default

describe('e2e proxy correlation spec', () => {
  systemTests.setup()

  systemTests.it('correctly correlates requests in chrome', {
    browser: 'chrome',
    spec: 'proxy_correlation.cy.js',
    processEnv: {
      DEBUG: 'cypress:proxy:http:util:prerequests',
    },
    onStderr (stderr) {
      // there are currently 2 unmatched requests that are sent by Chrome when the browser is opened
      // if these change in the future, just update the number and requests below
      expect(stderr).to.include('unmatchedRequests: 2')
      expect(stderr).to.include('Never received pre-request or url without pre-request for request GET-https://clientservices.googleapis.com')
      expect(stderr).to.include('Never received pre-request or url without pre-request for request POST-https://accounts.google.com/')
      expect(stderr).to.include('unmatchedPreRequests: 0')
    },
  })

  systemTests.it('correctly correlates requests in electron', {
    browser: 'electron',
    spec: 'proxy_correlation.cy.js',
    processEnv: {
      DEBUG: 'cypress:proxy:http:util:prerequests',
    },
    onStderr (stderr) {
      expect(stderr).to.include('unmatchedRequests: 0')
      expect(stderr).to.include('unmatchedPreRequests: 0')
    },
  })
})
