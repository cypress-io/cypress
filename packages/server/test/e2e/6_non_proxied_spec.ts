import e2e from '../support/helpers/e2e'
import Fixtures from '../support/helpers/fixtures'

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
