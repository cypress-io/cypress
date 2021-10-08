const e2e = require('../lib/e2e').default
const Fixtures = require('../lib/fixtures')

describe('e2e issue 2891', () => {
  e2e.setup()

  // https://github.com/cypress-io/cypress/issues/2891
  it('passes', function () {
    return e2e.exec(this, {
      project: Fixtures.projectPath('default-layout'),
      spec: 'default_layout_spec.js',
      sanitizeScreenshotDimensions: true,
      snapshot: true,
    })
  })
})
