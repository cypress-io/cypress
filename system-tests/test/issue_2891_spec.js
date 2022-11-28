const systemTests = require('../lib/system-tests').default

describe('e2e issue 2891', () => {
  systemTests.setup()

  // https://github.com/cypress-io/cypress/issues/2891
  it('passes', function () {
    return systemTests.exec(this, {
      project: 'default-layout',
      spec: 'default_layout.cy.js',
      sanitizeScreenshotDimensions: true,
      snapshot: true,
    })
  })
})
