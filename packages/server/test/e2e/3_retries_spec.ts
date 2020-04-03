const e2e = require('../support/helpers/e2e')
const Fixtures = require('../support/helpers/fixtures')

describe('e2e firefox', function () {
  e2e.setup()

  e2e.it('supports retries', {
    project: Fixtures.projectPath('retries-2'),
    spec: 'fail-twice.js',
  })
})

export {}
