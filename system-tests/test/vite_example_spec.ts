import systemTests from '../lib/system-tests'
import Fixtures from '../lib/fixtures'

describe('example vite test', function () {
  systemTests.setup()

  beforeEach(async () => {
    await Fixtures.scaffoldProject('e2e')
  })

  systemTests.it(`should load the support file`, {
    project: 'vite-ct',
    testingType: 'component',
    spec: 'src/support.cy.ts',
    expectedExitCode: 0,
  })
})
