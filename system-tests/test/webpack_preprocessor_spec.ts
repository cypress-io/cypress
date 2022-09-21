import systemTests from '../lib/system-tests'

describe('@cypress/webpack-preprocessor', function () {
  systemTests.setup()

  systemTests.it('with Webpack 5', {
    project: 'webpack-preprocessor-webpack-5',
    testingType: 'e2e',
    spec: '**/*.cy.js',
    browser: 'chrome',
    expectedExitCode: 0,
  })
})
