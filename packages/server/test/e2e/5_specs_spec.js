const e2e = require('../support/helpers/e2e').default
const Fixtures = require('../support/helpers/fixtures')

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

  // @see https://github.com/cypress-io/cypress/issues/14226
  it('handles the same integration and fixtures folders', function () {
    const project = Fixtures.projectPath('same-fixtures-integration-folders')

    return e2e.exec(this, {
      project,
      snapshot: false,
      expectedExitCode: 0,
    })
  })

  it('handles the fixtures folder being the subfolder of integration', function () {
    const project = Fixtures.projectPath('fixture-subfolder-of-integration')

    return e2e.exec(this, {
      project,
      snapshot: false,
      expectedExitCode: 0,
    })
  })
})
