const e2e = require('../support/helpers/e2e')
const Fixtures = require('../support/helpers/fixtures')

describe('e2e firefox', function () {
  e2e.setup()

  e2e.it('can run a lot of tests', {
    project: Fixtures.projectPath('firefox-memory'),
    spec: 'spec.js',
    browser: 'firefox',
    expectedExitCode: 0,
    timeout: 1e9,
    // snapshot: true,
  })
})
