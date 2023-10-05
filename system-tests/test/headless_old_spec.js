const systemTests = require('../lib/system-tests').default

describe('e2e', () => {
  systemTests.setup()

  systemTests.it('succeeds using --headless=old', {
    spec: 'headless_old.cy.js',
    browser: 'chrome',
    processEnv: {
      CHROMIUM_USE_HEADLESS_OLD: 1,
    },
  })
})
