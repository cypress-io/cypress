const e2e = require('../support/helpers/e2e')
const Fixtures = require('../support/helpers/fixtures')

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
