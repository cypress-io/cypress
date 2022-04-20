import systemTests from '../lib/system-tests'

describe('@cypress/webpack-dev-server', function () {
  systemTests.setup()

  describe('react', () => {
    systemTests.it('runs specs in webpack4, webpack_dev_server 3', {
      project: 'webpack4_wds3-react',
      testingType: 'component',
      browser: 'chrome',
      spec: null,
      configFile: 'cypress-webpack.config.ts',
      expectedExitCode: 2,
    })

    systemTests.it('runs specs in webpack4, webpack_dev_server 4', {
      project: 'webpack4_wds4-react',
      testingType: 'component',
      browser: 'chrome',
      spec: null,
      configFile: 'cypress-webpack.config.ts',
      expectedExitCode: 2,
    })

    systemTests.it('runs specs in webpack5, webpack_dev_server 3', {
      project: 'webpack5_wds3-react',
      testingType: 'component',
      browser: 'chrome',
      spec: null,
      configFile: 'cypress-webpack.config.ts',
      expectedExitCode: 2,
    })

    systemTests.it('runs specs in webpack5, webpack_dev_server 4', {
      project: 'webpack5_wds4-react',
      testingType: 'component',
      browser: 'chrome',
      spec: null,
      configFile: 'cypress-webpack.config.ts',
      expectedExitCode: 2,
    })
  })
})
