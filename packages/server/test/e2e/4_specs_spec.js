const e2e = require('../support/helpers/e2e').default

describe('e2e specs', () => {
  e2e.setup()

  it('failing when no specs found', function () {
    return e2e.exec(this, {
      config: { integrationFolder: 'cypress/specs' },
      snapshot: true,
      expectedExitCode: 1,
    })
  })

  it('failing when no spec pattern found', function () {
    return e2e.exec(this, {
      spec: 'cypress/integration/**notfound**',
      snapshot: true,
      expectedExitCode: 1,
    })
  })
})
