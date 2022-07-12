import systemTests from '../lib/system-tests'
import Fixtures from '../lib/fixtures'

describe('example vite test', function () {
  systemTests.setup()

  beforeEach(async () => {
    await Fixtures.scaffoldProject('e2e')
  })

  systemTests.it(`should load the support file`, {
    project: 'vite-ct-function-api',
    testingType: 'component',
    spec: 'src/support.cy.ts',
    expectedExitCode: 0,
    browser: 'electron',
  })

  systemTests.it(`should load the support file`, {
    project: 'vite-ct-object-api',
    testingType: 'component',
    spec: 'src/support.cy.ts',
    expectedExitCode: 0,
    browser: 'electron',
  })

  for (const major of [2, 3] as const) {
    systemTests.it.only(`should work with Vite ${major}.x`, {
      project: `vite-${major}-react`,
      testingType: 'component',
      spec: 'src/App.cy.jsx',
      configFile: 'cypress-vite.config.ts',
      expectedExitCode: 0,
      browser: 'electron',
    })
  }
})
