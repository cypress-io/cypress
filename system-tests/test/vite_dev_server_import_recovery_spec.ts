import systemTests from '../lib/system-tests'

import type { fixtureDirs } from '@tooling/system-tests'

type ProjectDirs = typeof fixtureDirs

const LATEST_VITE_REACT: ProjectDirs[number] = 'vite8.0.0-react'
const NATIVE_SUPPORT_IMPORT_REQUEST = '[vite-import-recovery] native support import request'

const countNativeSupportImportRequests = (stdout: string) => {
  return stdout.split(NATIVE_SUPPORT_IMPORT_REQUEST).length - 1
}

describe('@cypress/vite-dev-server native import recovery', function () {
  systemTests.setup()

  systemTests.it('recovers one failed native Vite support import', {
    project: LATEST_VITE_REACT,
    configFile: 'cypress-vite-import-recovery.config.ts',
    spec: 'src/App.cy.jsx',
    testingType: 'component',
    browser: 'chrome',
    expectedExitCode: 0,
    onRun: async (exec) => {
      const { stdout } = await exec({
        processEnv: {
          VITE_NATIVE_IMPORT_FAILURE_MODE: 'once',
        },
      })

      expect(countNativeSupportImportRequests(stdout)).to.equal(2)
    },
  })

  systemTests.it('surfaces a persistent native Vite support import failure after one reload', {
    project: LATEST_VITE_REACT,
    configFile: 'cypress-vite-import-recovery.config.ts',
    spec: 'src/App.cy.jsx',
    testingType: 'component',
    browser: 'chrome',
    config: {
      screenshotOnRunFailure: false,
    },
    expectedExitCode: 1,
    onRun: async (exec) => {
      const { stdout, stderr } = await exec({
        processEnv: {
          VITE_NATIVE_IMPORT_FAILURE_MODE: 'always',
        },
      })

      expect(countNativeSupportImportRequests(stdout)).to.equal(2)
      expect(`${stdout}\n${stderr}`).to.include('Failed to fetch dynamically imported module')
    },
  })
})
