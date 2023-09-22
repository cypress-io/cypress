const systemTests = require('../lib/system-tests').default

describe('e2e', () => {
  systemTests.setup()

  systemTests.it('succeeds using --headless=old', {
    spec: 'headless_old.cy.js',
    browser: 'chrome',
    processEnv: {
      // TODO: re-enable this once https://bugs.chromium.org/p/chromium/issues/detail?id=1483163
      // has been resolved and we have updated to a version of Chromium that includes the fix
      // CHROMIUM_USE_HEADLESS_OLD: 1,
    },
  })
})
