import systemTests from '../lib/system-tests'

describe('e2e firefox', function () {
  systemTests.setup()

  systemTests.it('launches maximized by default', {
    browser: 'firefox',
    project: 'screen-size',
    spec: 'maximized.cy.js',
  })

  // NOTE: only an issue on windows
  // https://github.com/cypress-io/cypress/issues/6392
  systemTests.it.skip('can run multiple specs', {
    browser: 'firefox',
    project: 'e2e',
    spec: 'simple.cy.js,simple_passing.cy.js',
  })
})
