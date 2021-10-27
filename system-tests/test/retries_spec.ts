import systemTests from '../lib/system-tests'
import Fixtures from '../lib/fixtures'

const it = systemTests.it

describe('retries', () => {
  systemTests.setup()

  it('supports retries', {
    project: Fixtures.projectPath('retries-2'),
    spec: 'fail-twice.js',
    snapshot: true,
  })

  it('completes a run of many retries in a reasonable time', {
    spec: 'hanging_retries_spec.js',
    expectedExitCode: 10,
  })

  it('warns about retries plugin', {
    project: Fixtures.projectPath('plugin-retries'),
    spec: 'main.spec.js',
    stubPackage: 'cypress-plugin-retries',
    snapshot: true,
  })
})
