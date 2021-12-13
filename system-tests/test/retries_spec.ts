import systemTests from '../lib/system-tests'

const it = systemTests.it

describe('retries', () => {
  systemTests.setup()

  it('supports retries', {
    project: 'retries-2',
    spec: 'fail-twice.js',
    snapshot: true,
  })

  it('completes a run of many retries in a reasonable time', {
    spec: 'hanging_retries.cy.js',
    expectedExitCode: 10,
  })

  it('warns about retries plugin', {
    project: 'plugin-retries',
    spec: 'main.spec.js',
    snapshot: true,
  })
})
