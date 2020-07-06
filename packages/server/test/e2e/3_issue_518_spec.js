const e2e = require('../support/helpers/e2e').default

describe('e2e issue 518', () => {
  e2e.setup()

  // https://github.com/cypress-io/cypress/issues/518
  e2e.it('bails', {
    bail: true,
    spec: 'issue_518_*',
    snapshot: true,
    expectedExitCode: 1,
  })
})
