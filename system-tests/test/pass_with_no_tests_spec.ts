import systemTests from '../lib/system-tests'
import Debug from 'debug'

const debug = Debug('system-tests:pass-with-no-tests')

describe('pass with no tests', function () {
  systemTests.setup()

  it('passes when no tests are found and --pass-with-no-tests is set', function () {
    return systemTests.exec(this, {
      spec: '**/*.cy.js',
      project: 'no-specs',
      passWithNoTests: true,
      expectedExitCode: 0,
    })
    .then((result) => {
      debug(result.stdout)
      expect(result.stdout).to.include('No tests were found.')
      expect(result.stdout).to.include('We searched for specs matching this glob pattern:')
    })
  })
})
