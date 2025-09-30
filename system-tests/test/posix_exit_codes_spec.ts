import systemTests from '../lib/system-tests'

describe('posix exit codes', () => {
  systemTests.setup()

  describe('when posix exit codes are enabled', () => {
    systemTests.it('returns 1 when there are failing tests', {
      spec: 'simple_failing.cy.js',
      posixExitCodes: true,
      expectedExitCode: 1,
      browser: ['electron'],
      project: 'e2e',
    })

    systemTests.it('returns 2 when there are 2 failing tests and posix is disabled', {
      spec: 'simple_failing.cy.js',
      posixExitCodes: false,
      expectedExitCode: 2,
      browser: ['electron'],
      project: 'e2e',
    })

    systemTests.it('returns 0 when there are no failing tests', {
      spec: 'simple_passing.cy.js',
      posixExitCodes: true,
      expectedExitCode: 0,
      browser: ['electron'],
      project: 'e2e',
    })
  })
})
