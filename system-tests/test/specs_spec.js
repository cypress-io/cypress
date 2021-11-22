const systemTests = require('../lib/system-tests').default
const Fixtures = require('../lib/fixtures')

describe('e2e specs', () => {
  systemTests.setup()

  it('failing when no specs found', function () {
    return systemTests.exec(this, {
      config: { integrationFolder: 'cypress/specs' },
      testingType: 'e2e',
      snapshot: true,
      expectedExitCode: 1,
    })
  })

  it('failing when no spec pattern found', function () {
    return systemTests.exec(this, {
      spec: 'cypress/integration/**notfound**',
      testingType: 'e2e',
      snapshot: true,
      expectedExitCode: 1,
    })
  })

  // @see https://github.com/cypress-io/cypress/issues/14226
  it('handles the same integration and fixtures folders', function () {
    const project = Fixtures.projectPath('same-fixtures-integration-folders')

    return systemTests.exec(this, {
      project,
      testingType: 'e2e',
      snapshot: false,
      expectedExitCode: 0,
    })
  })

  it('handles the fixtures folder being the subfolder of integration', function () {
    const project = Fixtures.projectPath('fixture-subfolder-of-integration')

    return systemTests.exec(this, {
      project,
      testingType: 'e2e',
      snapshot: false,
      expectedExitCode: 0,
    })
  })

  it('handles specs with special characters in the file name', function () {
    const project = Fixtures.projectPath('spec-name-special-characters')

    return systemTests.exec(this, {
      project,
      snapshot: false,
      expectedExitCode: 0,
    })
  })
})
