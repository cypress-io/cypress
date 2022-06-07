import systemTests from '../lib/system-tests'

describe('e2e headed', function () {
  systemTests.setup()

  it('runs multiple specs in headed mode', async function () {
    await systemTests.exec(this, {
      project: 'cypress-in-cypress',
      headed: true,
      browser: ['chrome', 'firefox', 'electron'],
      spec: 'dom-content.spec.js,dom-container.spec.js',
      snapshot: true,
      expectedExitCode: 0,
    })
  })
})
