import systemTests from '../lib/system-tests'

describe('metadata API', () => {
  systemTests.setup()

  systemTests.it('persists metadata across hooks and test config overrides', {
    project: 'metadata_api',
    expectedExitCode: 0,
    browser: 'electron',
  })
})
