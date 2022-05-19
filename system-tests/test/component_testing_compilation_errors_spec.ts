import systemTests from '../lib/system-tests'
import type { fixtureDirs } from '@tooling/system-tests'

type ProjectDirs = typeof fixtureDirs

const WEBPACK_REACT: ProjectDirs[number][] = ['webpack4_wds3-react', 'webpack4_wds4-react', 'webpack5_wds3-react', 'webpack5_wds4-react']
const VITE_REACT: ProjectDirs[number][] = ['vite2.8.6-react', 'vite2.9.1-react']

describe('component testing projects with compilation errors', function () {
  systemTests.setup()

  for (const project of WEBPACK_REACT) {
    it(`executes all of the tests for ${project}`, function () {
      return systemTests.exec(this, {
        project,
        configFile: 'cypress-webpack.config.ts',
        testingType: 'component',
        snapshot: true,
        expectedExitCode: 3,
      })
    })
  }

  for (const project of VITE_REACT) {
    it(`executes all of the tests for ${project}`, function () {
      return systemTests.exec(this, {
        project,
        configFile: 'cypress-vite.config.ts',
        testingType: 'component',
        snapshot: true,
        expectedExitCode: 3,
      })
    })
  }
})
