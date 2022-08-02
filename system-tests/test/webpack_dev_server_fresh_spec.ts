import systemTests from '../lib/system-tests'
import type { fixtureDirs } from '@tooling/system-tests'
import { stripAnsi } from '@packages/server/lib/errors'

type ProjectDirs = typeof fixtureDirs

const WEBPACK_REACT: ProjectDirs[number][] = ['webpack4_wds3-react', 'webpack4_wds4-react', 'webpack5_wds3-react', 'webpack5_wds4-react']

describe('@cypress/webpack-dev-server', function () {
  systemTests.setup()

  describe('react', () => {
    for (const project of WEBPACK_REACT) {
      it(`executes all of the tests for ${project}`, function () {
        return systemTests.exec(this, {
          project,
          configFile: 'cypress-webpack.config.ts',
          testingType: 'component',
          browser: 'chrome',
          snapshot: true,
          expectedExitCode: 3,
          onStdout: (stdout) => {
            return systemTests.normalizeWebpackErrors(stripAnsi(stdout))
          },
        })
      })
    }
  })
})
