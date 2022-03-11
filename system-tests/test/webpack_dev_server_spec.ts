import systemTests from '../lib/system-tests'

describe('@cypress/webpack-dev-server', function () {
  systemTests.setup()

  systemTests.it('successfully loads and runs all specs', {
    project: 'webpack-dev-server',
    testingType: 'component',
    spec: '**/*',
    browser: 'chrome',
    expectedExitCode: 0,
  })
})
