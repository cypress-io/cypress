import systemTests from '../lib/system-tests'

describe('e2e issue 32493: ESM config loading should not fail', () => {
  systemTests.setup()

  systemTests.it('loads the config file', {
    spec: 'app.cy.js',
    browser: 'chrome',
    project: 'config-cjs-and-esm/config-with-mjs',
    expectedExitCode: 0,
  })
})
