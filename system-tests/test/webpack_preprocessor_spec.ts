import systemTests from '../lib/system-tests'

describe('@cypress/webpack-preprocessor', function () {
  systemTests.setup()

  systemTests.it('with Webpack 4', {
    project: 'webpack-preprocessor-webpack-4',
    testingType: 'e2e',
    spec: '**/*.cy.js',
    browser: 'chrome',
    expectedExitCode: 0,
  })

  systemTests.it('with Webpack 5', {
    project: 'webpack-preprocessor-webpack-5',
    testingType: 'e2e',
    spec: '**/*.cy.js',
    browser: 'chrome',
    expectedExitCode: 0,
  })
})

describe('@cypress/webpack-batteries-included-preprocessor', function () {
  systemTests.setup()

  systemTests.it('with Webpack 4', {
    project: 'webpack-preprocessor-webpack-4-batteries-included',
    testingType: 'e2e',
    spec: '**/*.cy.js',
    browser: 'chrome',
    expectedExitCode: 0,
  })

  systemTests.it('with Webpack 5', {
    project: 'webpack-preprocessor-webpack-5-batteries-included',
    testingType: 'e2e',
    spec: '**/*.cy.js',
    browser: 'chrome',
    expectedExitCode: 0,
  })
})
