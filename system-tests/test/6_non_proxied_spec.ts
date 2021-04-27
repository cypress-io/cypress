import e2e from '../lib/e2e'
import Fixtures from '../lib/fixtures'

describe('e2e non-proxied spec', () => {
  e2e.setup()

  e2e.it('passes', {
    spec: 'spec.js',
    config: {
      video: false,
    },
    browser: 'chrome',
    project: Fixtures.projectPath('non-proxied'),
    snapshot: true,
  })
})
