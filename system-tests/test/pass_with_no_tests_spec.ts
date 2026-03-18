import systemTests from '../lib/system-tests'
import Debug from 'debug'

const debug = Debug('system-tests:pass-with-no-tests')

describe('cli arg: --pass-with-no-tests', function () {
  systemTests.setup()

  it('passes when no spec files are found and --pass-with-no-tests is set', function () {
    return systemTests.exec(this, {
      spec: '**/*.cy.js',
      project: 'no-specs',
      passWithNoTests: true,
      expectedExitCode: 0,
    })
    .then((result) => {
      debug(result.stdout)
      expect(result.stdout).to.include('0 found')
      expect(result.stdout).to.include('Searched:')
      expect(result.stdout).to.include('cypress/e2e/**/*.cy.js')
    })
  })

  it('passes when no tests are found and --pass-with-no-tests is set', function () {
    return systemTests.exec(this, {
      spec: '**/*.cy.js',
      project: 'no-tests',
      passWithNoTests: true,
      expectedExitCode: 0,
    })
  })
})
