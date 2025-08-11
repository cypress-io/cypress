import systemTests from '../lib/system-tests'

describe('e2e yarn v3.1.1', () => {
  systemTests.it('can compile plugin and test specs', {
    snapshot: false,
    browser: 'electron',
    project: 'yarn-v3.1.1-pnp',
  })
})
