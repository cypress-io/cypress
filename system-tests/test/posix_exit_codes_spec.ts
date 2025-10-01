import systemTests from '../lib/system-tests'

describe('posix exit codes', () => {
  systemTests.setup()

  describe('when posix exit codes are enabled', () => {
    const posixExitCodes = true

    systemTests.it('returns 1 when there are multiple failing tests', {
      spec: 'simple_failing.cy.js',
      posixExitCodes,
      expectedExitCode: 1,
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

  describe('when posix exit codes are disabled', () => {
    const posixExitCodes = false

    systemTests.it('returns 2 when there are 2 failing tests', {
      spec: 'simple_failing.cy.js',
      posixExitCodes,
      expectedExitCode: 2,
      browser: ['electron'],
      project: 'e2e',
    })
  })
})
