import systemTests from '../lib/system-tests'

describe('@cypress/webpack-dev-server', function () {
  systemTests.setup()

  systemTests.it('successfully loads and runs all specs', {
    project: 'webpack-dev-server',
    testingType: 'component',
    spec: 'src/**/*',
    browser: 'chrome',
    expectedExitCode: 0,
  })

  systemTests.it('successfully loads and runs all specs with typescript config', {
    project: 'webpack-dev-server-ts',
    testingType: 'component',
    spec: 'test.cy.ts',
    browser: 'chrome',
    expectedExitCode: 0,
  })
})
