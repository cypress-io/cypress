import systemTests from '../lib/system-tests'

import type { fixtureDirs } from '@tooling/system-tests'

type ProjectDirs = typeof fixtureDirs

const WEBPACK_REACT: ProjectDirs[number][] = ['webpack4_wds4-react', 'webpack5_wds4-react', 'webpack5_wds5-react']

describe('@cypress/webpack-dev-server', function () {
  systemTests.setup()

  describe('react', () => {
    for (const project of WEBPACK_REACT) {
      systemTests.it(`executes all of the tests for ${project}`, {
        project,
        configFile: 'cypress-webpack.config.ts',
        testingType: 'component',
        browser: 'chrome',
        snapshot: true,
        expectedExitCode: 7,
        onStdout: (stdout) => {
          return systemTests.normalizeWebpackErrors(stdout)
        },
      })

      systemTests.it(`executes all of the tests for ${project} when port is statically configured`, {
        project,
        configFile: 'cypress-webpack-port.config.ts',
        spec: 'src/port.cy.jsx',
        testingType: 'component',
        browser: 'chrome',
        snapshot: true,
        expectedExitCode: 0,
        onStdout: (stdout) => {
          return systemTests.normalizeWebpackErrors(stdout)
        },
      })
    }
    systemTests.it('throws graceful error when user tries to run wds5 with webpack 4', {
      project: 'webpack4_wds5-react',
      configFile: 'cypress-webpack.config.ts',
      testingType: 'component',
      browser: 'chrome',
      snapshot: true,
      expectedExitCode: 1,
      onStdout: (stdout) => {
        return systemTests.normalizeWebpackErrors(stdout)
      },
    })
  })
})
