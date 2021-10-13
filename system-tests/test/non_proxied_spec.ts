import systemTests from '../lib/system-tests'
import Fixtures from '../lib/fixtures'

describe('e2e non-proxied spec', () => {
  systemTests.setup()

  systemTests.it('passes', {
    spec: 'spec.js',
    config: {
      video: false,
    },
    browser: 'chrome',
    project: Fixtures.projectPath('non-proxied'),
    snapshot: true,
  })
})
