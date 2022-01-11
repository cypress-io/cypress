import systemTests from '../lib/system-tests'
import Fixtures from '../lib/fixtures'

describe('example vite test', function () {
  systemTests.setup()

  beforeEach(() => {
    Fixtures.scaffoldProject('e2e')
  })

  systemTests.it(`runs a vite project properly`, {
    project: 'vite-ct',
    testingType: 'component',
    spec: 'support.spec.ts',
    expectedExitCode: 0,
  })
})
