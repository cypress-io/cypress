import systemTests from '../lib/system-tests'
import type { fixtureDirs } from '@tooling/system-tests'

type ProjectDirs = typeof fixtureDirs

// TODO: This is a temporary workaround. Will readdress with: https://github.com/cypress-io/cypress/issues/22992
// const VITE_REACT: ProjectDirs[number][] = ['vite2.8.6-react', 'vite2.9.1-react', 'vite3.0.2-react']
const VITE_REACT: ProjectDirs[number][] = ['vite2.8.6-react', 'vite2.9.1-react']

describe('@cypress/vite-dev-server', function () {
  systemTests.setup()

  describe('react', () => {
    for (const project of VITE_REACT) {
      it(`executes all of the tests for ${project}`, function () {
        return systemTests.exec(this, {
          project,
          configFile: 'cypress-vite.config.ts',
          testingType: 'component',
          browser: 'chrome',
          snapshot: true,
          expectedExitCode: 3,
          onStdout: (stdout) => {
            return stdout.replace(/http:\/\/localhost:\d+/g, 'http://localhost:xxxx')
          },
        })
      })
    }
  })
})
