import systemTests from '../lib/system-tests'

describe('example vite test', function () {
  systemTests.setup()

  systemTests.it(`should load the support file`, {
    project: 'vite-ct',
    testingType: 'component',
    spec: 'src/support.cy.ts',
    expectedExitCode: 0,
  })
})
