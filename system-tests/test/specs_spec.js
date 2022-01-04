const systemTests = require('../lib/system-tests').default

describe('e2e specs', () => {
  systemTests.setup()

  it('failing when no specs found', function () {
    return systemTests.exec(this, {
      project: 'no-specs-found',
      testingType: 'e2e',
      snapshot: true,
      expectedExitCode: 1,
    })
  })

  // @see https://github.com/cypress-io/cypress/issues/14226
  it('handles the same integration and fixtures folders', function () {
    return systemTests.exec(this, {
      testingType: 'e2e',
      project: 'same-fixtures-integration-folders',
      snapshot: false,
      expectedExitCode: 0,
    })
  })

  it('handles the fixtures folder being the subfolder of integration', function () {
    return systemTests.exec(this, {
      testingType: 'e2e',
      project: 'fixture-subfolder-of-integration',
      snapshot: false,
      expectedExitCode: 0,
    })
  })

  it('handles specs with special characters in the file name', function () {
    return systemTests.exec(this, {
      project: 'spec-name-special-characters',
      snapshot: false,
      expectedExitCode: 0,
    })
  })
})
