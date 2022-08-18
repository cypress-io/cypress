const systemTests = require('../lib/system-tests').default

describe('e2e specs', () => {
  systemTests.setup()

  it('failing when no specs found and default specPattern', function () {
    return systemTests.exec(this, {
      project: 'no-specs',
      snapshot: true,
      expectedExitCode: 1,
    })
  })

  it('failing when no specs found and custom specPattern', function () {
    return systemTests.exec(this, {
      project: 'no-specs-custom-pattern',
      snapshot: true,
      expectedExitCode: 1,
    })
  })

  it('failing when no specs found and spec pattern provided from CLI', function () {
    return systemTests.exec(this, {
      project: 'no-specs',
      spec: 'does/not/exist/**notfound**',
      snapshot: true,
      expectedExitCode: 1,
    })
  })

  it('failing when no specs found with custom spec pattern and spec pattern provided from CLI', function () {
    return systemTests.exec(this, {
      project: 'no-specs-custom-pattern',
      spec: 'does/not/exist/**notfound**',
      snapshot: true,
      expectedExitCode: 1,
    })
  })

  // @see https://github.com/cypress-io/cypress/issues/14226
  it('handles the same integration and fixtures folders', function () {
    return systemTests.exec(this, {
      project: 'same-fixtures-integration-folders',
      snapshot: false,
      expectedExitCode: 0,
    })
  })

  it('handles the fixtures folder being the subfolder of integration', function () {
    return systemTests.exec(this, {
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

  it('handles glob characters in the working directory and spec pattern provided from CLI', function () {
    return systemTests.exec(this, {
      project: 'project-with-(glob)-[chars]',
      spec: '**/*.cy.js',
      snapshot: true,
      expectedExitCode: 0,
    })
  })
})
